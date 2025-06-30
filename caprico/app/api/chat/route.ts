import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = "AIzaSyB8sB1FhxLfbztTVeUg47-gn5MyvRmmjsw"
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

export async function POST(request: NextRequest) {
  try {
    const { messages, files } = await request.json()

    // Convert messages to Gemini format
    const geminiMessages = messages.map((message: any) => {
      let content = message.content

      // If the message has files, include file information in the content
      if (message.files && message.files.length > 0) {
        const fileDescriptions = message.files
          .map((file: any) => {
            let description = `File: ${file.name} (${file.type})`
            if (file.content && file.fileType === "document") {
              description += `\nContent: ${file.content.substring(0, 1000)}${file.content.length > 1000 ? "..." : ""}`
            } else if (file.fileType === "image") {
              description += "\n[Image file uploaded - please analyze the image]"
            }
            return description
          })
          .join("\n\n")

        content = `${content}\n\nAttached files:\n${fileDescriptions}`
      }

      return {
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: content }],
      }
    })

    // If there are files in the current request, add them to the context
    if (files && files.length > 0) {
      const fileContext = files
        .map((file: any) => {
          let description = `File: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)}KB)`
          if (file.content && file.fileType === "document") {
            description += `\nContent: ${file.content.substring(0, 2000)}${file.content.length > 2000 ? "..." : ""}`
          } else if (file.fileType === "image") {
            description += "\n[Image file - please analyze and describe what you see]"
          }
          return description
        })
        .join("\n\n")

      // Add file context to the last user message
      if (geminiMessages.length > 0) {
        const lastMessage = geminiMessages[geminiMessages.length - 1]
        if (lastMessage.role === "user") {
          lastMessage.parts[0].text += `\n\nFiles uploaded:\n${fileContext}`
        }
      }
    }

    // Create the request payload for Gemini
    const requestBody = {
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    }

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API Error:", errorText)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()

    // Extract the generated content
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I could not generate a response."

    return NextResponse.json({ content })
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
