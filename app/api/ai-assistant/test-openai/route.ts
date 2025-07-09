import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test 1: Check if API key exists
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    const keyLength = process.env.OPENAI_API_KEY?.length || 0;
    
    // Test 2: Try to initialize OpenAI
    let openaiInitialized = false;
    let openaiError = null;
    
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      openaiInitialized = true;
    } catch (error) {
      openaiError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Test 3: Try a simple API call
    let apiCallSuccess = false;
    let apiCallError = null;
    let apiResponse = null;
    
    if (openaiInitialized && hasApiKey) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Reply with just "OK" to confirm you are working.' }
          ],
          max_tokens: 10,
          temperature: 0
        });
        
        apiCallSuccess = true;
        apiResponse = completion.choices[0]?.message?.content || 'No response';
      } catch (error) {
        apiCallError = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return NextResponse.json({
      tests: {
        keyExists: hasApiKey,
        keyLength,
        openaiInitialized,
        openaiError,
        apiCallSuccess,
        apiCallError,
        apiResponse
      },
      summary: {
        status: apiCallSuccess ? 'working' : 'not working',
        message: apiCallSuccess 
          ? 'OpenAI is configured and working correctly' 
          : `OpenAI is not working: ${apiCallError || openaiError || 'No API key'}`
      }
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}