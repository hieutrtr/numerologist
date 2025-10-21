"""
Pipecat Bot Service for Daily.co Voice Conversations

Singleton service that manages Pipecat pipelines for voice conversations.
Each conversation gets its own pipeline instance with:
- DailyTransport (WebRTC audio streaming)
- AzureSTTService (Speech-to-Text)
- NumerologyAgentProcessor (AI agent)
- ElevenLabsTTSService (Text-to-Speech)

Story 1.2d: Daily.co Bot Participant with Pipecat Framework
"""

import logging
from typing import Dict, Optional

from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner, PipelineTask
from pipecat.transports.daily.transport import DailyTransport, DailyParams
from pipecat.services.openai.stt import OpenAISTTService
from pipecat.transcriptions.language import Language

from ..config import settings

logger = logging.getLogger(__name__)


class PipecatBotService:
    """
    Singleton service that manages Pipecat pipelines for Daily.co voice conversations.

    Manages the lifecycle of bot pipelines:
    - create_pipeline(): Creates and starts a new pipeline for a conversation
    - destroy_pipeline(): Stops and cleans up a pipeline
    - get_pipeline_status(): Returns pipeline running status
    - destroy_all_pipelines(): Cleanup all pipelines on shutdown
    """

    _instance: Optional['PipecatBotService'] = None
    _pipelines: Dict[str, PipelineTask] = {}
    _transports: Dict[str, DailyTransport] = {}

    def __new__(cls):
        """Implement singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._pipelines = {}
            cls._transports = {}
            logger.info("PipecatBotService singleton instance created")
        return cls._instance

    async def create_pipeline(
        self,
        room_url: str,
        conversation_id: str,
        token: str,
        user_id: str
    ) -> PipelineTask:
        """
        Create and start a Pipecat pipeline for a conversation.

        Args:
            room_url: Daily.co room URL (e.g., https://yourdomain.daily.co/room-name)
            conversation_id: Unique conversation ID
            token: Daily.co meeting token
            user_id: User ID for this conversation

        Returns:
            PipelineTask instance

        Raises:
            ValueError: If pipeline already exists for conversation_id
        """
        if conversation_id in self._pipelines:
            raise ValueError(f"Pipeline already exists for conversation {conversation_id}")

        logger.info(
            f"Creating pipeline for conversation {conversation_id}",
            extra={
                "conversation_id": conversation_id,
                "room_url": room_url,
                "user_id": user_id,
            }
        )

        try:
            # Task 3: Configure DailyTransport for WebRTC audio streaming
            daily_params = DailyParams(
                audio_in_enabled=True,      # Receive user audio
                audio_out_enabled=True,     # Send bot audio
                camera_in_enabled=False,    # No video input
                camera_out_enabled=False,   # No video output
                # Note: VAD (Voice Activity Detection) is enabled by default via audio_in_enabled
                # audio_in_passthrough can be used to disable passthrough if needed
            )

            daily_transport = DailyTransport(
                room_url=room_url,
                token=token,
                bot_name="Numeroly Assistant",
                params=daily_params,
            )

            logger.info(
                f"DailyTransport configured for room {room_url}",
                extra={"conversation_id": conversation_id, "bot_name": "Numeroly Assistant"}
            )

            # Task 4: Configure Azure OpenAI STT for Vietnamese speech-to-text
            # Using OpenAI Whisper API format with Azure OpenAI endpoint
            azure_stt_base_url = (
                f"{settings.azure_openai_endpoint}/openai/deployments/"
                f"{settings.azure_openai_stt_deployment_name}"
            )

            azure_stt = OpenAISTTService(
                model=settings.azure_openai_stt_deployment_name,  # gpt-4o-mini-transcribe
                api_key=settings.azure_openai_key,
                base_url=azure_stt_base_url,
                language=Language.VI_VN,  # Vietnamese language
            )

            logger.info(
                f"Azure OpenAI STT configured for Vietnamese transcription",
                extra={
                    "conversation_id": conversation_id,
                    "model": settings.azure_openai_stt_deployment_name,
                    "language": "vi-VN"
                }
            )

            # TODO: Task 5 - Add NumerologyAgentProcessor
            # agent_processor = NumerologyAgentProcessor(
            #     conversation_id=conversation_id,
            #     user_id=user_id,
            # )

            # TODO: Task 6 - Add ElevenLabsTTSService
            # elevenlabs_tts = ElevenLabsTTSService(
            #     api_key=settings.elevenlabs_api_key,
            #     voice_id=settings.elevenlabs_voice_id,
            #     model="eleven_multilingual_v2",
            # )

            # Create pipeline with DailyTransport input/output
            # Pipeline flow: transport.input() → STT → [Agent] → [TTS] → transport.output()
            pipeline = Pipeline([
                daily_transport.input(),    # Audio frames from user
                azure_stt,                  # Speech → Text (Vietnamese)
                # TODO: Task 5 - Add agent_processor here
                # TODO: Task 6 - Add elevenlabs_tts processor here
                daily_transport.output(),   # Audio frames to user
            ])

            # Create and store pipeline task
            task = PipelineTask(pipeline)
            self._pipelines[conversation_id] = task
            self._transports[conversation_id] = daily_transport

            logger.info(
                f"Pipeline created and started for conversation {conversation_id}",
                extra={"conversation_id": conversation_id}
            )

            return task

        except Exception as e:
            logger.error(
                f"Failed to create pipeline for conversation {conversation_id}: {e}",
                extra={"conversation_id": conversation_id, "error": str(e)},
                exc_info=True
            )
            raise

    async def destroy_pipeline(self, conversation_id: str) -> None:
        """
        Stop and cleanup a pipeline.

        Args:
            conversation_id: Conversation ID

        Raises:
            ValueError: If no pipeline found for conversation_id
        """
        if conversation_id not in self._pipelines:
            raise ValueError(f"No pipeline found for conversation {conversation_id}")

        logger.info(
            f"Destroying pipeline for conversation {conversation_id}",
            extra={"conversation_id": conversation_id}
        )

        try:
            task = self._pipelines[conversation_id]
            transport = self._transports.get(conversation_id)

            # Cleanup transport (leave Daily.co room, release resources)
            if transport:
                try:
                    await transport.cleanup()
                    logger.info(
                        f"DailyTransport cleaned up for conversation {conversation_id}",
                        extra={"conversation_id": conversation_id}
                    )
                except Exception as cleanup_error:
                    logger.warning(
                        f"Error cleaning up transport: {cleanup_error}",
                        extra={"conversation_id": conversation_id}
                    )

            # Cancel the task (async operation)
            if hasattr(task, 'cancel'):
                cancel_result = task.cancel()
                if hasattr(cancel_result, '__await__'):
                    await cancel_result

            # Remove from tracking
            del self._pipelines[conversation_id]
            if conversation_id in self._transports:
                del self._transports[conversation_id]

            logger.info(
                f"Pipeline destroyed for conversation {conversation_id}",
                extra={"conversation_id": conversation_id}
            )

        except Exception as e:
            logger.error(
                f"Error destroying pipeline for conversation {conversation_id}: {e}",
                extra={"conversation_id": conversation_id, "error": str(e)},
                exc_info=True
            )
            raise

    def get_pipeline_status(self, conversation_id: str) -> Dict[str, any]:
        """
        Get pipeline status.

        Args:
            conversation_id: Conversation ID

        Returns:
            Status dictionary with 'status' and 'conversation_id' keys
        """
        if conversation_id not in self._pipelines:
            return {"status": "not_found"}

        task = self._pipelines[conversation_id]

        # Check if task is done/cancelled
        is_running = not (hasattr(task, 'done') and task.done())

        return {
            "status": "running" if is_running else "stopped",
            "conversation_id": conversation_id,
        }

    async def destroy_all_pipelines(self) -> None:
        """
        Stop and cleanup all pipelines (for graceful shutdown).
        """
        logger.info(f"Destroying all pipelines ({len(self._pipelines)} active)")

        # Create list of conversation IDs to avoid modifying dict during iteration
        conversation_ids = list(self._pipelines.keys())

        for conversation_id in conversation_ids:
            try:
                await self.destroy_pipeline(conversation_id)
            except Exception as e:
                logger.error(
                    f"Error destroying pipeline {conversation_id} during shutdown: {e}",
                    extra={"conversation_id": conversation_id, "error": str(e)}
                )

        logger.info("All pipelines destroyed")
