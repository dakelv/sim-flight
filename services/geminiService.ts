import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SimulationState, GameStatus, Speaker } from "../types";

// DIRECT ACCESS: The build tool replaces this exact string with the key.
// Do not add "typeof" checks here.
const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  console.error("API KEY MISSING: Check your .env file and ensure it starts with VITE_");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

// System Prompt defining the persona and rules
const SYSTEM_INSTRUCTION = `
You are "The Go / No-Go Pressure Cooker", an advanced Aviation Training Simulator.
You are simulating a scenario for a Pilot in Command (PIC) of a King Air 350.
Route: Thunder Bay (CYQT) to Toronto Island (CYTZ).
Current Time: 16:30 Local (Winter, twilight/dark). 30 mins late.

ROLES YOU PLAY (Simulate these distinct voices):
1. Co-Pilot (First Officer): Experienced but has "get-home-itis". Minimizes risks. Says things like "It's just a little frost," or "We can beat the front."
2. Dispatcher: Overworked, pushed by corporate. Provides data but exerts subtle schedule pressure.
3. VIP Passenger (The CEO): Arrogant, late, demanding. Yells from the back. Doesn't care about safety, only meetings.

SCENARIO CONTEXT:
- Weather: Freezing drizzle reported in vicinity. Temp -2C. Low visibility.
- Aircraft: King Air 350. "Master Warning" flickered on startup, now off.
- Regulatory Framework: Transport Canada CARs.

CRITICAL RULES (LOGIC):
1. **Clean Aircraft Concept**: It is ILLEGAL (CAR 602.11) to takeoff with frost, ice, or snow adhering to critical surfaces.
2. **Master Warning**: A flicker must be investigated via the MEL (Minimum Equipment List). If investigated, reveal it is an "Inverter Fail" or similar no-go item unless fixed.
3. **Delayed Consequences**: If the pilot decides to TAKEOFF with ice or unresolved warnings, DO NOT stop them immediately. Let them takeoff. Then, in the next turn, describe a stall, wing drop, or instrument failure leading to a CRASH.
4. **Pressure**: If the pilot hesitates or asks for too much info, have the VIP yell or the Co-Pilot complain about duty time.

RESPONSE FORMAT:
Return JSON matching the schema.
- 'visualDescription': A HIGHLY DETAILED prompt for an image generator. Describe exactly what the pilot sees (e.g., "View of the left wing through rain-streaked glass, patches of rough ice forming on the leading edge, runway lights blurring in the distance").
- 'gameStatus': 'ACTIVE' until the final decision. 'CRASHED' if they ignore safety and takeoff. 'SUCCESS' if they make a NO-GO decision citing specific safety reasons (Ice/Mechanical). 'FAILED' if they cancel for the wrong reason.
- 'feedback': If the game ends, cite the specific logic/regulation.
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    dialogue: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          speaker: { type: Type.STRING },
          text: { type: Type.STRING },
        },
        required: ["speaker", "text"],
      },
    },
    visualDescription: {
      type: Type.STRING,
      description: "A vivid description of the current visual scene from the pilot's perspective for image generation.",
    },
    gameStatus: {
      type: Type.STRING,
      enum: ["ACTIVE", "CRASHED", "SUCCESS", "FAILED"],
      description: "Current state of the simulation.",
    },
    feedback: {
      type: Type.STRING,
      description: "If the game ended (CRASHED, SUCCESS, FAILED), explain why based on CARs. Otherwise empty.",
    },
  },
  required: ["dialogue", "visualDescription", "gameStatus"],
};

export const startScenario = async (): Promise<SimulationState> => {
  try {
    const model = "gemini-2.5-flash";
    const response = await ai.models.generateContent({
      model,
      contents: `
        BEGIN SIMULATION.
        1. Visual: Generate a description of a bleak, snowy view from the cockpit window looking out at the King Air's wing. Ice is visible.
        2. Action: The VIP (CEO) is banging on the divider asking why the propellers aren't turning.
        3. Data: Provide the current marginal METAR/TAF for CYQT/CYTZ.
      `,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const data = JSON.parse(text);
    
    return {
      visualDescription: data.visualDescription,
      dialogue: data.dialogue.map((d: any) => ({ ...d, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) })),
      status: data.gameStatus as GameStatus,
      feedback: data.feedback
    };

  } catch (error) {
    console.error("Error starting scenario:", error);
    throw error;
  }
};

export const processAction = async (action: string, history: any[]): Promise<SimulationState> => {
  try {
    // Format history for context (simplified for this demo)
    const contextStr = JSON.stringify(history.slice(-6)); 
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `History: ${contextStr}. User Action: "${action}". 
      React to this. 
      - If they look at the wing/surfaces: GENERATE A VISUAL DESCRIPTION of the ice/snow.
      - If they ignore risks and TAKEOFF: Transition to CRASHED state with a description of the crash.
      - If they cancel (NO-GO): Evaluate their reasoning.
      `,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);

    return {
      visualDescription: data.visualDescription,
      dialogue: data.dialogue.map((d: any) => ({ ...d, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) })),
      status: data.gameStatus as GameStatus,
      feedback: data.feedback
    };
  } catch (error) {
    console.error("Error processing action:", error);
    throw error;
  }
};

export const generateScenarioImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `Cinematic, photorealistic, first-person POV from inside a King Air 350 cockpit. Aviation photography. Atmosphere: Dark, Winter, Stormy, Tense. ${prompt}`,
      config: {
        numberOfImages: 1,
        aspectRatio: '16:9', 
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) throw new Error("No image generated");
    
    return `data:image/png;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Image generation failed", error);
    // Return a placeholder or transparent pixel to avoid broken UI
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  }
};