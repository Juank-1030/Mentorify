"""
LLM module for Mentorify
OpenAI client and system prompts
"""

from llm.cliente_openai import ClienteOpenAI, get_cliente_openai
from llm.system_prompt import get_system_prompt, get_few_shot_examples

__all__ = ['ClienteOpenAI', 'get_cliente_openai', 'get_system_prompt', 'get_few_shot_examples']
