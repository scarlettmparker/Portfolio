const returnAvatar = (avatar: string, discordId: string) => {
    return avatar === "default" 
        ? "https://cdn.discordapp.com/embed/avatars/0.png" 
        : `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png?size=1024`;
}

export default returnAvatar;