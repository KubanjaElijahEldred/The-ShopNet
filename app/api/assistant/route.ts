import { NextResponse } from "next/server";
import {
  addCartItem,
  createChatMessage,
  createOrder,
  getCartItems,
  getFilteredProducts,
  getOrdersForUser,
  getWishlistItems
} from "@/lib/data";
import { getSessionUser } from "@/lib/session";

type AssistantRequest = {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
};

const openAiApiKey = process.env.OPENAI_API_KEY;

function latestUserMessage(messages: AssistantRequest["messages"]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content || "";
}

function heuristicIntent(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("add") && lower.includes("cart")) {
    return "add_to_cart";
  }

  if (lower.includes("order") || lower.includes("purchase") || lower.includes("buy")) {
    return "place_order";
  }

  if (lower.includes("chat") || lower.includes("message") || lower.includes("seller")) {
    return "chat";
  }

  return "search";
}

function formatMoney(value: number) {
  return `UGX ${value.toLocaleString()}`;
}

function summarizeConversation(messages: AssistantRequest["messages"]) {
  return messages
    .slice(-10)
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
    .join("\n");
}

export async function POST(request: Request) {
  const body = (await request.json()) as AssistantRequest;
  const user = await getSessionUser();
  const prompt = latestUserMessage(body.messages);
  const intent = heuristicIntent(prompt);

  if (intent === "search") {
    const products = await getFilteredProducts({ query: prompt });
    const top = products.slice(0, 3);
    const reply =
      top.length === 0
        ? "I could not find a matching product. Open `/products` and try a broader keyword."
        : `I found: ${top
            .map((product) => `${product.title} (${formatMoney(product.price)}) -> /products/${product.id}`)
            .join(", ")}.`;

    if (!openAiApiKey) {
      return NextResponse.json({ reply });
    }
  }

  if (!user && intent !== "search") {
    return NextResponse.json({
      reply: "Please login first so I can add items to your cart, chat with sellers, or place an order for you."
    });
  }

  if (intent === "add_to_cart" && user) {
    const products = await getFilteredProducts({ query: prompt });
    const product = products[0];

    if (!product) {
      return NextResponse.json({ reply: "I could not find a product to add to cart." });
    }

    await addCartItem(user.id, product.id, 1);
    return NextResponse.json({
      reply: `I added ${product.title} to your cart. Open /cart to review and checkout.`
    });
  }

  if (intent === "chat" && user) {
    const products = await getFilteredProducts({ query: prompt });
    const product = products[0];

    if (!product) {
      return NextResponse.json({ reply: "Tell me which product you want to chat about." });
    }

    await createChatMessage({
      ownerId: product.ownerId,
      participantId: user.id,
      senderId: user.id,
      senderName: user.name,
      senderEmail: user.email,
      senderProfileImage: user.profileImage,
      productId: product.id,
      message: `Hello, I am interested in ${product.title}. ${prompt}`
    });

    const chatParams = new URLSearchParams({
      productId: product.id,
      ownerId: product.ownerId
    });

    return NextResponse.json({
      reply: `I started a chat with the seller about ${product.title}. Open /chat?${chatParams.toString()} to continue.`
    });
  }

  if (intent === "place_order" && user) {
    const order = await createOrder({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      location: user.location,
      paymentMethod: prompt.toLowerCase().includes("airtel")
        ? "Airtel Money"
        : prompt.toLowerCase().includes("mtn")
          ? "MTN Mobile Money"
          : "Cash on Delivery"
    });

    return NextResponse.json({
      reply: `Your order ${order.id} is placed. Open /orders to track status updates.`
    });
  }

  if (openAiApiKey) {
    const catalog = await getFilteredProducts({});
    const topCatalog = catalog.slice(0, 12);
    const [cartItems, wishlistItems, orders] = user
      ? await Promise.all([
          getCartItems(user.id),
          getWishlistItems(user.id),
          getOrdersForUser(user.id)
        ])
      : [[], [], []];

    const systemContext = [
      "ShopNet routes:",
      "/ (home), /products, /products/[id], /cart, /orders, /chat, /profile, /admin, /admin/dashboard, /assistant",
      user
        ? `Current user: ${user.name} (${user.email}), role: ${user.role || "user"}, location: ${user.location}`
        : "Current user: guest",
      user
        ? `User data: cart items=${cartItems.length}, wishlist items=${wishlistItems.length}, orders=${orders.length}`
        : "Guest limitations: cannot place orders or add to cart until login/signup.",
      "Top catalog sample:",
      topCatalog
        .map((product) => `- ${product.title} | ${product.category} | ${formatMoney(product.price)} | /products/${product.id}`)
        .join("\n")
    ].join("\n");

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content:
                "You are K.E.E Tech, the ShopNet system assistant. Give practical, smart, app-aware guidance. Use exact route paths when suggesting where to go next. Keep responses concise."
            },
            {
              role: "system",
              content: `System context:\n${systemContext}`
            },
            {
              role: "user",
              content: `Conversation:\n${summarizeConversation(body.messages)}\n\nLatest user request: ${prompt}`
            }
          ]
        })
      });

      const data = await response.json();

      return NextResponse.json({
        reply: data.output_text || "I could not complete that request."
      });
    } catch {
      return NextResponse.json({
        reply:
          "I can still help. Open /products to browse, /cart to checkout, /chat to talk to sellers, or /orders to track purchases."
      });
    }
  }

  return NextResponse.json({
    reply: "I could not determine the next action. Try asking me to search, add to cart, chat, or place an order."
  });
}
