# 2D Soldier Game

A simple 2D shooting game built with Flask and HTML5 Canvas.

## Setup

1. Make sure you have Python installed on your system
2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the Flask application:
   ```
   python app.py
   ```
4. Open your web browser and navigate to `http://localhost:5000`

## Controls

- **Movement**: WASD keys
- **Shooting**: Click with mouse
- **Weapon Switching**:
  - 1: Pistol
  - 2: Assault Rifle
  - 3: Shotgun

## Game Features

- Health system
- Score system
- Multiple weapons (Pistol, Assault Rifle, Shotgun)
- Different levels with increasing difficulty
- Enemy soldiers that chase the player
- Ammunition management

## Game Rules

1. You start with 100 health
2. Each enemy soldier deals damage on contact
3. Eliminate all enemies to progress to the next level
4. Each level has more enemies than the previous one
5. Game ends when your health reaches 0

## Weapons

- **Pistol**: Balanced weapon with medium damage and fire rate
- **Assault Rifle**: Fast firing weapon with lower damage
- **Shotgun**: High damage but slow firing rate and limited ammo 