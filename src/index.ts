
import type{ Provider } from "./types.js";
import { createOpenAICompat } from "./openai-comapt.js";



const  provider:Record<string, ()=>Provider>={
    "groq":()=>createOpenAICompat("groq", "https://api.groq.com/openai/v1",process.env.GROQ_API_KEY!,"qwen/qwen3.8-27b")
}

export function getProvider(name:string):Provider{
    const create  = provider[name];
    if(!create){
        throw new Error("garbar ha vai!!!")
    }

    return create();
}