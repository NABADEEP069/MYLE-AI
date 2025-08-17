import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);


const masterPrompt = `
You are an AI Diagnostic and Prescription Assistant. Your purpose is to help identify potential diseases based on symptoms and suggest first-line treatments based on trusted medical sources like the WHO and FDA. You are not a doctor and your output must be treated as informational.

Given the user's symptoms, you must perform the following steps:
1.  Analyze the symptoms.
2.  Provide a list of up to 3 probable diseases, each with a confidence score as a percentage.
3.  For the most likely disease, recommend a first-line medication, standard dosage, and common precautions.
4.  If the symptoms suggest a life-threatening condition (e.g., "crushing chest pain," "cannot breathe"), your ONLY response must be a JSON object with a "critical_warning" field.
5.  You MUST return your entire response in a strict JSON format. Do not add any text, notes, or markdown formatting before or after the JSON object.

The user's symptoms are:
`;

export async function POST(req: NextRequest) {
  try {
    const body: { symptoms: string } = await req.json();
    const { symptoms } = body;

    if (!symptoms) {
      return NextResponse.json(
        { error: "Symptoms are required." },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `${masterPrompt} "${symptoms}"`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const data = JSON.parse(text);

    return NextResponse.json(data);

  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Failed to get diagnosis. Please try again." },
      { status: 500 }
    );
  }
}