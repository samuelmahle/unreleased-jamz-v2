
import { Song } from "@/types/song";

const sampleSongs: Song[] = [
  {
    id: "1",
    title: "Midnight Groove",
    artist: "Luna Echo",
    genre: "Electronic",
    releaseDate: "2024-12-10",
    audioUrl: "https://s3.us-east-1.amazonaws.com/cdn.compose.art/uploads/89941/land-of-peace_msp.mp3", 
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bXVzaWN8ZW58MHx8MHx8fDA%3D",
    isFavorite: false,
    uploadDate: "2023-10-15T12:00:00Z",
  },
  {
    id: "2",
    title: "Crystal Waves",
    artist: "Neon Dreams",
    genre: "Synthwave",
    releaseDate: "2024-11-15",
    audioUrl: "https://s3.us-east-1.amazonaws.com/cdn.compose.art/uploads/89943/land-of-peace_msp.mp3",
    imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bXVzaWN8ZW58MHx8MHx8fDA%3D",
    isFavorite: true,
    uploadDate: "2023-09-22T15:30:00Z",
  },
  {
    id: "3",
    title: "Lost in Time",
    artist: "Quantum Flux",
    genre: "Ambient",
    releaseDate: "2025-01-20",
    audioUrl: "https://s3.us-east-1.amazonaws.com/cdn.compose.art/uploads/89947/land-of-peace_msp.mp3",
    imageUrl: "https://images.unsplash.com/photo-1504509546545-e000b4a62425?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fG11c2ljfGVufDB8fDB8fHww",
    isFavorite: false,
    uploadDate: "2023-11-05T09:15:00Z",
  },
  {
    id: "4",
    title: "Urban Echoes",
    artist: "Street Pulse",
    genre: "Hip-Hop",
    releaseDate: "2024-10-05",
    audioUrl: "https://s3.us-east-1.amazonaws.com/cdn.compose.art/uploads/50412/simple-emma-fadeout_msp.mp3",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8bXVzaWN8ZW58MHx8MHx8fDA%3D",
    isFavorite: false,
    uploadDate: "2023-08-30T18:45:00Z",
  },
  {
    id: "5",
    title: "Stellar Journey",
    artist: "Cosmic Voyage",
    genre: "Space Ambient",
    releaseDate: "2025-03-15",
    audioUrl: "https://s3.us-east-1.amazonaws.com/cdn.compose.art/uploads/50413/simple-emma-fadeout_msp.mp3",
    imageUrl: "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fG11c2ljfGVufDB8fDB8fHww",
    isFavorite: true,
    uploadDate: "2023-12-01T14:20:00Z",
  },
];

export default sampleSongs;
