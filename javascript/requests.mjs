import * as main from './skrypt.mjs';
import * as characters from './characters.mjs';
import * as inventory from './inventory.mjs';

export async function loginRequest(username, password) {
    try {
        const response = await fetch('/game/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Set the content type to JSON
            },
            body: JSON.stringify({ username, password }), // Convert data to a JSON string
        });

        const responseData = await response.json();
        
        if (!responseData.success) {
            return false;
        }
        return true;
    }
    
    catch (error) {
        console.error('Request failed:', error);
        return false;
    }
}

export async function logoutRequest() {
    try {
        const response = await fetch('/game/logout');
        if (!response.ok) {
            throw new Error('Failed to logout!');
        }
        const data = await response.json();
        window.location.assign('http://localhost:3000/login');
        return true;
    } catch (error) {
        console.error('Request failed:', error);
        return false;
    }
}

export async function registerRequest(username, password) {
    try {
        const response = await fetch('/game/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Set the content type to JSON
            },
            body: JSON.stringify({ username, password }), // Convert data to a JSON string
        });

        const responseData = await response.json();
        
        if (!responseData.success) {
            return false;
        }
  
        return true;
    }
    
    catch (error) {
        console.error('Request failed:', error);
        return false;
    }
}

export async function createHeroRequest() {
    try {
        const response = await fetch('/game/create-hero', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Set the content type to JSON
            }
        });

        const responseData = await response.json();
        
        if (!responseData.success) {
            return false;
        }
  
        return true;
    }
    
    catch (error) {
        console.error('Request failed:', error);
        return false;
    }
}

export async function createInventoryRequest(frame) {
    try {
        const response = await fetch('/game/create-invenotry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Set the content type to JSON
            },
            body: JSON.stringify({frame})
        });

        const responseData = await response.json();
        
        if (!responseData.success) {
            return false;
        }
  
        return true;
    }
    
    catch (error) {
        console.error('Request failed:', error);
        return false;
    }
}

export async function saveInventoryRequest(data) {
    console.log('Wejscie1', data);
    try {
        const response = await fetch('/game/save-inventory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Set the content type to JSON
            },
            body: JSON.stringify(data) // Convert data to a JSON string
        });

        if (!response.ok) {
            throw new Error('Failed to save inventory');
        }

        const responseData = await response.json();
        console.log('Request successful:', responseData);
        return true;
    }
    
    catch (error) {
        console.error('Request failed:', error);
        return false;
    }
}

export async function loadInventoryRequest() {
    try {
        const response = await fetch('/game/load-inventory');                            // Make a request to server

        if (!response.ok) {                                                             // If response is not ok
            throw new Error('Failed to fetch inventory data');                          // Create new error
        }
        const data = await response.json();                                             // Get data from response
        return data;                                                                    // Return true
    } catch (error) {                                                                   // If there is an error in exception
        console.error('Request failed:', error);                                        // Log error
        return false;                                                                   // Return false
    }
}

export async function loggedUser() {
    try {
        const response = await fetch('/game/auth');
        const data = await response.json();
        if (!Object.keys(data).length) {
            return false;
        }
        return true;
    } catch (error) {
        console.error('Request failed:', error);
        return false;
    }
}

export async function connectDatabase() {
    try {
        const response = await fetch('/game/database/connect');
        if (!response.ok) {
            throw new Error('Failed to connect to the database');
        }
        const data = await response.json();
        console.log('Request successful:', data);
        return true;
    } catch (error) {
        console.error('Request failed:', error);
        return false;
    }
}

export async function saveGame(posX, posY, stage, monsters, places) {
    try {
        const response = await fetch('/game/save-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Set the content type to JSON
            },
            body: JSON.stringify({ posX, posY, stage, monsters, places }), // Convert data to a JSON string
        });

        const responseData = await response.json();
        console.log('Request successful:', responseData);
        return true;
    }
    
    catch (error) {
        console.error('Request failed:', error);
        return false;
    }
}

export async function loadGame() {
    try {
        const response = await fetch('/game/load-game');
        if (!response.ok) {
            throw new Error('Failed to load game');
        }
        const data = await response.json();

        const name = data.hero[0].hero_name;
        const mapX = data.hero[0].position_x;
        const mapY = data.hero[0].position_y;
        const stage = data.hero[0].current_stage;
        const monsters = data.hero[0].killed_monsters;
        const places = data.hero[0].founded_places;

        main.setMapCordinates(mapX, mapY);

        characters.hero.name = name;
        characters.hero.statistics.currentStage = stage;
        characters.hero.statistics.killedMonsters = monsters;
        
        let tempPlaces = [];
        if (places != null) {
            tempPlaces = places.split(',');
        } 
        
        const stats = {
            'stage': stage,
            'killedMonsters': monsters,
            'discoveredPlaces': tempPlaces,
        };

        characters.hero.setStatistics(stats);

        return true;
    } catch (error) {
        console.error('Request failed:', error);
        return false;
    }
}

export async function loadItems() {
    const itemsArray = [];
    try {
        const response = await fetch('/game/load-items');
        if (!response.ok) {
            throw new Error('Failed to load items');
        }
        const data = await response.json();
  
        for (let i = 0; i < data.items.length; i++) {
            if (data.items[i].item_image != null) {
                const id = data.items[i].id_ite_item;
                const image = data.items[i].item_image;
                const type = data.items[i].item_type;
                const name = data.items[i].item_name;
                const damage = data.items[i].item_damage;
                const defense = data.items[i].item_defense;
                const hitpoints = data.items[i].item_hitpoints;
                const cost = data.items[i].item_cost;
                itemsArray.push(new inventory.Item(id, 'url(' + image + ')', type, name, damage, defense, hitpoints, cost));
            }
        }
        inventory.setItemsArray(itemsArray);
        return true;
    } catch (error) {
        console.error('Request failed:', error);
        return false;
    }
}