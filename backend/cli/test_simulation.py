#!/usr/bin/env python3
"""
Interactive CLI tool for testing the WebSocket simulation server.
"""

import asyncio
import json
import websockets
from datetime import datetime
from typing import Optional
import httpx
import questionary
from rich.console import Console
from rich.json import JSON
from rich.panel import Panel
from rich.text import Text

console = Console()


async def authenticate(email: str, password: str) -> Optional[str]:
    """Authenticate user with email and password, get JWT token."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8000/auth/signin",
                json={"email": email, "password": password},
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("token")
            elif response.status_code == 401:
                console.print(f"[red]Error: Invalid email or password.[/red]")
                return None
            else:
                console.print(f"[red]Authentication failed: {response.status_code} - {response.text}[/red]")
                return None
    except httpx.ConnectError:
        console.print("[red]Error: Could not connect to server. Is it running on http://localhost:8000?[/red]")
        return None
    except Exception as e:
        console.print(f"[red]Authentication error: {str(e)}[/red]")
        return None


def display_message(message: dict, message_num: int):
    """Display WebSocket message with pretty formatting."""
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    msg_type = message.get("type", "unknown")
    
    # Create header with message number and type
    header = Text(f"Message #{message_num} - {msg_type.upper()}", style="bold cyan")
    header.append(f" [{timestamp}]", style="dim")
    
    # Format JSON with rich
    json_str = json.dumps(message, indent=2)
    json_display = JSON(json_str)
    
    # Create panel with colored border based on message type
    border_style = {
        "state": "green",
        "result": "yellow",
        "training": "blue",
        "training_complete": "green",
        "error": "red",
        "stopped": "dim",
    }.get(msg_type, "white")
    
    panel = Panel(
        json_display,
        title=header,
        border_style=border_style,
        padding=(0, 1)
    )
    
    console.print(panel)


async def run_auto_mode(websocket, mode: str):
    """Run auto or train mode simulation."""
    await websocket.send(json.dumps({"type": "start", "mode": mode}))
    message_num = 0
    
    try:
        while True:
            message_str = await websocket.recv()
            message = json.loads(message_str)
            message_num += 1
            display_message(message, message_num)
            
            # Check for completion conditions
            if message.get("type") == "result":
                console.print("\n[green]Simulation completed![/green]")
                break
            elif message.get("type") == "training_complete":
                console.print("\n[green]Training simulation completed![/green]")
                break
            elif message.get("type") == "error":
                console.print(f"\n[red]Error received: {message.get('message', 'Unknown error')}[/red]")
                break
    except websockets.exceptions.ConnectionClosed:
        console.print("\n[yellow]WebSocket connection closed.[/yellow]")
    except Exception as e:
        console.print(f"\n[red]Error receiving messages: {str(e)}[/red]")


async def run_manual_mode(websocket):
    """Run manual mode simulation with user input."""
    await websocket.send(json.dumps({"type": "start", "mode": "manual"}))
    message_num = 0
    
    try:
        while True:
            # Receive state update
            message_str = await websocket.recv()
            message = json.loads(message_str)
            message_num += 1
            display_message(message, message_num)
            
            # Check for completion
            if message.get("type") == "result":
                console.print("\n[green]Simulation completed![/green]")
                break
            elif message.get("type") == "error":
                console.print(f"\n[red]Error received: {message.get('message', 'Unknown error')}[/red]")
                break
            
            # Only prompt for action if we received a state update
            if message.get("type") == "state":
                # Prompt for thrust
                thrust_input = await asyncio.to_thread(
                    questionary.text(
                        "Enter thrust (0.0-1.0):",
                        default="0.5",
                        validate=lambda x: (
                            True if (x.replace(".", "").replace("-", "").isdigit() and 
                                    0.0 <= float(x) <= 1.0) 
                            else "Please enter a number between 0.0 and 1.0"
                        )
                    ).ask
                )
                
                if thrust_input is None:
                    console.print("\n[yellow]Cancelled by user.[/yellow]")
                    await websocket.send(json.dumps({"type": "stop"}))
                    break
                
                # Prompt for angle
                angle_input = await asyncio.to_thread(
                    questionary.text(
                        "Enter angle:",
                        default="0.0",
                        validate=lambda x: (
                            True if x.replace(".", "").replace("-", "").isdigit() 
                            else "Please enter a valid number"
                        )
                    ).ask
                )
                
                if angle_input is None:
                    console.print("\n[yellow]Cancelled by user.[/yellow]")
                    await websocket.send(json.dumps({"type": "stop"}))
                    break
                
                # Send action
                action = {
                    "type": "action",
                    "thrust": float(thrust_input),
                    "angle": float(angle_input)
                }
                await websocket.send(json.dumps(action))
                console.print(f"[dim]Sent action: thrust={thrust_input}, angle={angle_input}[/dim]\n")
                
    except websockets.exceptions.ConnectionClosed:
        console.print("\n[yellow]WebSocket connection closed.[/yellow]")
    except KeyboardInterrupt:
        console.print("\n[yellow]Interrupted by user. Stopping simulation...[/yellow]")
        try:
            await websocket.send(json.dumps({"type": "stop"}))
        except:
            pass
    except Exception as e:
        console.print(f"\n[red]Error: {str(e)}[/red]")


async def main():
    """Main CLI entry point."""
    console.print("[bold cyan]WebSocket Simulation Test CLI[/bold cyan]\n")
    
    # Prompt for email
    email = await asyncio.to_thread(
        questionary.text("Enter your email:").ask
    )
    
    if not email:
        console.print("[red]Email is required. Exiting.[/red]")
        return
    
    # Prompt for password
    password = await asyncio.to_thread(
        questionary.password("Enter your password:").ask
    )
    
    if not password:
        console.print("[red]Password is required. Exiting.[/red]")
        return
    
    # Authenticate
    console.print(f"\n[dim]Authenticating as {email}...[/dim]")
    token = await authenticate(email, password)
    
    if not token:
        console.print("[red]Authentication failed. Exiting.[/red]")
        return
    
    console.print("[green]Authentication successful![/green]\n")
    
    # Select mode
    mode = await asyncio.to_thread(
        questionary.select(
            "Select simulation mode:",
            choices=[
                questionary.Choice("Auto Mode (agent runs automatically)", "auto"),
                questionary.Choice("Train Mode (10 training episodes)", "train"),
                questionary.Choice("Manual Mode (you control thrust and angle)", "manual"),
            ]
        ).ask
    )
    
    if not mode:
        console.print("[yellow]No mode selected. Exiting.[/yellow]")
        return
    
    console.print(f"\n[cyan]Connecting to WebSocket server...[/cyan]")
    
    # Connect to WebSocket
    try:
        uri = "ws://localhost:8000/ws/simulate"
        headers = {"Authorization": f"Bearer {token}"}
        
        async with websockets.connect(uri, additional_headers=headers) as websocket:
            console.print("[green]Connected![/green]\n")
            
            if mode == "manual":
                await run_manual_mode(websocket)
            else:
                await run_auto_mode(websocket, mode)
                
    except websockets.exceptions.WebSocketException as e:
        status_code = getattr(e, 'status_code', None)
        reason = getattr(e, 'reason', str(e))
        if status_code == 1008:
            console.print(f"[red]Connection refused: {reason}[/red]")
        elif status_code:
            console.print(f"[red]WebSocket connection failed: {status_code} - {reason}[/red]")
        else:
            console.print(f"[red]WebSocket connection failed: {reason}[/red]")
    except websockets.exceptions.ConnectionClosedError as e:
        console.print(f"[red]Connection closed: {e.code} - {e.reason}[/red]")
    except Exception as e:
        console.print(f"[red]Connection error: {str(e)}[/red]")
    
    console.print("\n[dim]Goodbye![/dim]")


if __name__ == "__main__":
    asyncio.run(main())

