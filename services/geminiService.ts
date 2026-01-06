
import { GoogleGenAI } from "@google/genai";
import { CardType, Attribute, VariationStrength } from "../types";

const MODEL_NAME = 'gemini-2.5-flash-image';

export const generateCardArt = async (params: {
  cardType: CardType;
  attribute: Attribute;
  name: string;
  description: string;
  customPrompt?: string;
  isVariation?: boolean;
  baseImageBase64?: string;
  userImageBase64?: string; // New: user provided image
  variationStrength?: VariationStrength;
  variationChanges?: string;
  isBack?: boolean;
}) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  let prompt = "";
  
  if (params.isBack) {
    prompt = `Create a professional trading card back design for a collectible card game.
    Theme: ${params.customPrompt || 'ornate mystical patterns, intricate decorative borders, symmetrical composition, rich color scheme with gold/silver accents, abstract magical symbols'}. 
    Style: Highly detailed, ornamental, symmetrical, professional TCG card back aesthetic. Intricate border work. Vertical composition, suitable for 63mm x 88mm. No text on the card back.`;
  } else if (!params.isVariation) {
    // New Design Prompt
    prompt = `Generate professional trading card game artwork. 
    Subject: ${params.name || 'a mysterious creature'}. 
    Card Type: ${params.cardType}. 
    Attribute: ${params.attribute}. 
    Lore/Effect: ${params.description || 'fantasy artwork'}. 
    Additional Creative Direction: ${params.customPrompt || ''}.
    ${params.userImageBase64 ? "IMPORTANT: Use the provided image as the primary visual reference for the character/subject and composition." : ""}
    
    Style requirements:
    - High-detail anime/manga or modern fantasy illustration style.
    - Dramatic, centered composition with a clear focal point.
    - Vibrant, professional color grading with dynamic lighting.
    - Detailed background that complements the subject.
    Format: Square 1:1 ratio trading card artwork.`;
  } else {
    // Variation Prompt
    prompt = `Create a VARIATION of the provided trading card artwork while preserving the core design identity and style.
    Original Character: ${params.name}.
    Existing Theme: ${params.description}.
    
    MAINTAIN STRICTLY:
    - The character's core features and identifying traits.
    - The specific art style, linework, and color palette.
    
    MODIFICATIONS TO APPLY: ${params.variationChanges || "slightly different pose, alternative viewing angle, or different lighting while keeping character recognizable"}.
    ${params.userImageBase64 ? "ADDITIONAL REFERENCE: Incorporate elements or style cues from the provided secondary image into this variation." : ""}
    Variation Intensity: ${params.variationStrength || 'moderate'}.
    
    Format: Square 1:1 ratio trading card composition.`;
  }

  const parts: any[] = [{ text: prompt }];
  
  // Prioritize user image if provided, otherwise use base image for variations
  const referenceImage = params.userImageBase64 || params.baseImageBase64;

  if (referenceImage) {
    const base64Data = referenceImage.includes(',') 
      ? referenceImage.split(',')[1] 
      : referenceImage;

    parts.unshift({
      inlineData: {
        data: base64Data,
        mimeType: 'image/png'
      }
    });
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("The Forge failed to manifest an image. Please try again.");
};
