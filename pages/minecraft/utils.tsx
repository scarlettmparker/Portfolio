const helper: React.FC = () => {
    return null;
};
  
export default helper;

// FIND UUID BY USERNAME REQUEST
export async function getUUID(username: string) {
    const response = await fetch(`../api/minecraft/getuuid`, {
        method: 'POST',
        body: JSON.stringify(username)
    });
    const jsonResponse = await response.json();
    return jsonResponse;
}

// CHECK IF USERNAME -> UUID EXISTS IN DATABASE
export async function checkUUIDExists(username: string) {
    const response = await fetch(`../api/minecraft/uuidexists`, {
        method: 'POST',
        body: JSON.stringify(username)
    });
    const jsonResponse = await response.json();
    return jsonResponse;
}

// GET SKIN BY UUID REQUEST
export async function getSkin(uuid: string) {
    const response = await fetch(`../api/minecraft/getskin`, {
        method: 'POST',
        body: JSON.stringify(uuid)
    });
    
    const jsonResponse = await response.json();
    return jsonResponse;
}

// GET NUMBER OF IMAGES IN GALLERY
export async function getGalleryCount() {
    const response = await fetch(`../api/minecraft/getgallerycount`);
    const jsonResponse = await response.json();
    return jsonResponse.pngCount;
}

// GET TASK DATA BY SESSION
export async function getTaskData(session: number) {
    const response = await fetch(`../api/minecraft/gettaskdata`, {
        method: 'POST',
        body: JSON.stringify({ session })
    });
    
    const jsonResponse = await response.json();
    return jsonResponse;
}

// GET EVERY PLAYER DATA FILE
export async function getPlayerData() {
    const response = await fetch(`../api/minecraft/getplayerdata`);
    const jsonResponse = await response.json();
    return jsonResponse;
}