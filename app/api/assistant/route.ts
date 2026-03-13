import { NextResponse } from "next/server";
import {
  addCartItem,
  createChatMessage,
  createOrder,
  getFilteredProducts
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
        ? "I could not find a matching product."
        : `I found these products: ${top
            .map((product) => `${product.title} (UGX ${product.price.toLocaleString()})`)
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
      reply: `I added ${product.title} to your cart. You can open the cart page to review it.`
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

    return NextResponse.json({
      reply: `I started a chat with the seller about ${product.title}. Open the chat page to continue.`
    });
  }

  if (intent === "place_order" && user) {
    const order = await createOrder({
      userId: user.id,
      userName: user.name,
      location: user.location,
      paymentMethod: prompt.toLowerCase().includes("airtel")
        ? "Airtel Money"
        : prompt.toLowerCase().includes("mtn")
          ? "MTN Mobile Money"
          : "Cash on Delivery"
    });

    return NextResponse.json({
      reply: `Your order ${order.id} has been placed. The seller has been notified in their account and on their registered mobile number.`
    });
  }

  if (openAiApiKey) {
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
              "You are the ShopNet shopping assistant. Help users search, add to cart, chat, and order products. Be concise."
          },
          ...body.messages.map((message) => ({
            role: message.role,
            content: message.content
          }))
        ]
      })
    });

    const data = await response.json();

    return NextResponse.json({
      reply: data.output_text || "I could not complete that request."
    });
  }

  return NextResponse.json({
    reply: "I could not determine the next action. Try asking me to search, add to cart, chat, or place an order."
  });
}
