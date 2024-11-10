# Chatbot Server using Flask and WebSocket

from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import threading

app = Flask(__name__)
socketio = SocketIO(app)

# Store active chat sessions
active_sessions = {}

# Function to handle user connections
@socketio.on('connect_user')
def connect_user(data):
    user_id = data['user_id']
    if user_id not in active_sessions:
        active_sessions[user_id] = None
    emit('connected', {'message': 'You are connected. Waiting for an agent.'})

# Function to connect user to an available agent
@socketio.on('request_agent')
def request_agent(user_id):
    for agent_id in active_sessions:
        if active_sessions[agent_id] is None:
            active_sessions[agent_id] = user_id
            emit('agent_connected', {'agent_id': agent_id}, room=user_id)
            emit('chat_started', {'message': 'Chat session started.'}, room=agent_id)
            return
    emit('no_agents', {'message': 'No agents available at the moment.'}, room=user_id)

# Function to handle message sending
@socketio.on('send_message')
def send_message(data):
    user_id = data['user_id']
    message = data['message']
    agent_id = active_sessions.get(user_id)
    if agent_id:
        emit('receive_message', {'message': message, 'from': user_id}, room=agent_id)

# Function to handle agent ending the chat
@socketio.on('end_chat')
def end_chat(agent_id):
    user_id = active_sessions[agent_id]
    if user_id:
        emit('chat_ended', {'message': 'The agent has ended the chat.'}, room=user_id)
        emit('goodbye', {'message': 'Goodbye!'}, room=user_id)
        active_sessions[agent_id] = None

# Run the Flask app
if __name__ == '__main__':
    socketio.run(app)
