import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.agent import AgentSession, AgentAction, ChatMessage


class AgentMemory:
    def __init__(self, db: Session, workspace_id: str, session_id: Optional[str] = None):
        self.db = db
        self.workspace_id = workspace_id
        self.session_id = session_id

    def create_session(self, goal: str, user_id: Optional[str] = None) -> AgentSession:
        session = AgentSession(
            workspace_id=self.workspace_id,
            user_id=user_id,
            goal=goal,
            status="in_progress"
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        self.session_id = session.id
        return session

    def record_action(
        self,
        step_number: int,
        tool_name: str,
        purpose: str,
        tool_input: Dict[str, Any],
        tool_output: Dict[str, Any],
        duration_ms: float = 0.0,
        status: str = "success"
    ) -> AgentAction:
        if not self.session_id:
            raise ValueError("No active session ID")

        action = AgentAction(
            session_id=self.session_id,
            step_number=step_number,
            tool_name=tool_name,
            purpose=purpose,
            tool_input_json=json.dumps(tool_input, default=str),
            tool_output_json=json.dumps(tool_output, default=str),
            duration_ms=duration_ms,
            status=status
        )
        self.db.add(action)
        self.db.commit()
        self.db.refresh(action)
        return action

    def complete_session(self, summary: str):
        if self.session_id:
            session = self.db.query(AgentSession).filter(AgentSession.id == self.session_id).first()
            if session:
                session.status = "completed"
                session.summary = summary
                self.db.commit()

    def add_chat_message(
        self,
        role: str,
        content: str,
        user_id: Optional[str] = None,
        evidence: List[Dict[str, Any]] = None,
        tools_consulted: List[str] = None,
        recommendations: List[Dict[str, Any]] = None,
        confidence: float = 0.95
    ) -> ChatMessage:
        msg = ChatMessage(
            workspace_id=self.workspace_id,
            user_id=user_id,
            session_id=self.session_id,
            role=role,
            content=content,
            evidence_json=json.dumps(evidence or []),
            tools_consulted_json=json.dumps(tools_consulted or []),
            recommendations_json=json.dumps(recommendations or []),
            confidence=confidence
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg
