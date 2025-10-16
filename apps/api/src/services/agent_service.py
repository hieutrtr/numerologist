"""
Microsoft Agent Framework Orchestration Service

Provides centralized orchestration for conversational AI with Azure OpenAI and tool management.
Handles speech-to-text, reasoning, and generates responses for numerology conversations.

Architecture:
- STT Deployment: gpt-4o-mini-transcribe (12x cheaper, 54% better accuracy)
- Reasoning Deployment: gpt-4o-mini (numerology logic, tool invocation)
- Observability: Built-in OpenTelemetry integration with Azure Application Insights
"""

import json
import logging
from typing import Optional
from uuid import UUID

from agent_framework.azure import AzureOpenAIResponsesClient
from azure.identity import DefaultAzureCredential

from apps.api.src.config import settings

logger = logging.getLogger(__name__)


class NumerologyAgentService:
    """
    Agent Framework service for numerology conversations.
    
    Uses Microsoft Agent Framework to orchestrate Azure OpenAI for:
    1. Speech-to-text (gpt-4o-mini-transcribe)
    2. Conversation reasoning (gpt-4o-mini)
    3. Tool invocation (numerology calculations)
    4. Built-in observability and error handling
    """
    
    def __init__(self):
        """Initialize Agent Framework client with Azure OpenAI configuration."""
        try:
            # Initialize Azure OpenAI client with Agent Framework
            self.client = AzureOpenAIResponsesClient(
                api_key=settings.azure_openai_key,
                endpoint=settings.azure_openai_endpoint,
                deployment_name=settings.azure_openai_reasoning_deployment_name,
                api_version=settings.azure_openai_api_version,
            )
            
            logger.info(
                f"Agent Framework initialized with endpoint: {settings.azure_openai_endpoint}"
            )
            logger.info(
                f"STT Deployment: {settings.azure_openai_stt_deployment_name}"
            )
            logger.info(
                f"Reasoning Deployment: {settings.azure_openai_reasoning_deployment_name}"
            )
            
        except Exception as e:
            logger.error(f"Failed to initialize Agent Framework: {e}")
            raise
    
    async def process_voice_input(
        self,
        transcribed_text: str,
        user_id: UUID,
        conversation_id: Optional[UUID] = None,
        context: Optional[dict] = None,
    ) -> dict:
        """
        Process user voice input through agent framework.
        
        Args:
            transcribed_text: User's transcribed speech
            user_id: User ID for context
            conversation_id: Optional existing conversation ID
            context: Optional conversation context (previous messages, user profile, etc.)
        
        Returns:
            Dict with agent response, status, and metadata
        
        Raises:
            Exception: If agent processing fails
        """
        try:
            logger.info(
                f"Processing voice input for user {user_id}: {transcribed_text[:100]}..."
            )
            
            # Build system instructions for numerology agent
            system_prompt = self._build_system_prompt(context)
            
            # Call agent to generate response
            # Agent Framework handles:
            # - Conversation threading (automatic history)
            # - Tool invocation (numerology tools)
            # - Error handling and retries
            # - Observability (OpenTelemetry)
            
            # This is simplified - actual implementation would use agent.run()
            # with full tool definitions (added in story 2.1)
            response = await self.client.create_agent(
                name="NumerologyAgent",
                instructions=system_prompt,
            ).run(transcribed_text)
            
            logger.info(f"Agent response generated: {str(response)[:100]}...")
            
            return {
                "status": "success",
                "response": response,
                "user_id": str(user_id),
                "conversation_id": str(conversation_id) if conversation_id else None,
                "input_text": transcribed_text,
            }
            
        except Exception as e:
            logger.error(f"Error processing voice input: {e}")
            raise
    
    def _build_system_prompt(self, context: Optional[dict] = None) -> str:
        """
        Build system prompt for numerology agent.
        
        Args:
            context: Optional context including user profile
        
        Returns:
            System prompt string
        """
        base_prompt = """You are a warm, empathetic numerology guide providing Vietnamese-language 
numerology readings and spiritual guidance. 

Your role:
1. Calculate and interpret Pythagorean numerology (Life Path, Destiny, Soul Urge, etc.)
2. Provide personalized insights based on user's numerology profile
3. Offer practical, actionable advice grounded in numerology principles
4. Maintain a conversational, supportive tone throughout interactions

You have access to numerology calculation tools - use them when needed to provide accurate readings.
Always respond in Vietnamese unless the user requests otherwise.
Maintain emotional intelligence and cultural sensitivity in your responses."""
        
        if context and context.get("user_profile"):
            profile = context["user_profile"]
            base_prompt += f"\n\nUser Profile:\n{json.dumps(profile, indent=2)}"
        
        if context and context.get("conversation_history"):
            history = context["conversation_history"]
            base_prompt += f"\n\nRecent Conversation:\n{json.dumps(history, indent=2)}"
        
        return base_prompt
    
    async def health_check(self) -> dict:
        """
        Check Agent Framework and Azure OpenAI connectivity.
        
        Returns:
            Health status dict with agent readiness
        """
        try:
            # Simple test call to verify connectivity
            result = await self.client.create_agent(
                name="HealthCheckAgent",
                instructions="Respond with 'healthy' if you can process this message."
            ).run("Health check")
            
            if result:
                return {
                    "status": "healthy",
                    "agent_framework": "ready",
                    "azure_openai": "ready",
                }
            else:
                return {
                    "status": "degraded",
                    "agent_framework": "ready",
                    "azure_openai": "no_response",
                }
                
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "agent_framework": "error",
                "azure_openai": "error",
                "error": str(e),
            }


# Export singleton instance
agent_service = NumerologyAgentService()
