#!/usr/bin/env python3
"""
Test script to verify Google ADK agent integration with the chat system.
"""

import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

async def test_agent_integration():
    """Test the agent integration with sample legal questions."""
    
    try:
        # Import the chat function
        from chat import chat_with_law_agent
        
        # Test questions
        test_questions = [
            "What is Section 420 of IPC?",
            "How can I file an FIR?",
            "What are my rights as a tenant?",
            "Tell me a joke",  # This should be rejected as non-legal
            "What is the weather like?",  # This should be rejected as non-legal
        ]
        
        print("🧪 Testing Google ADK Agent Integration")
        print("=" * 50)
        
        for i, question in enumerate(test_questions, 1):
            print(f"\n📝 Test {i}: {question}")
            print("-" * 30)
            
            try:
                response = await chat_with_law_agent(question)
                print(f"✅ Response: {response}")
            except Exception as e:
                print(f"❌ Error: {e}")
            
            # Add a small delay between requests
            await asyncio.sleep(1)
        
        print("\n" + "=" * 50)
        print("✅ Agent integration test completed!")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure all dependencies are installed and the agent is properly configured.")
    except Exception as e:
        print(f"❌ Test failed: {e}")

async def test_simple_greetings():
    """Test simple greeting responses."""
    
    try:
        from chat import chat_with_law_agent
        
        print("\n🧪 Testing Simple Greetings")
        print("=" * 30)
        
        greetings = ["hello", "hi", "hey", "good morning"]
        
        for greeting in greetings:
            print(f"\n📝 Greeting: {greeting}")
            response = await chat_with_law_agent(greeting)
            print(f"✅ Response: {response}")
        
        print("\n✅ Greeting tests completed!")
        
    except Exception as e:
        print(f"❌ Greeting test failed: {e}")

async def main():
    """Run all tests."""
    print("🚀 Starting Google ADK Agent Integration Tests")
    print("=" * 60)
    
    # Test simple greetings first
    await test_simple_greetings()
    
    # Test agent integration
    await test_agent_integration()
    
    print("\n🎉 All tests completed!")

if __name__ == "__main__":
    # Run the tests
    asyncio.run(main()) 