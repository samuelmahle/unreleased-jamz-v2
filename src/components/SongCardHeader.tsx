        <h3 className="text-lg font-semibold truncate text-white group-hover:text-music-accent transition-colors">
          {song.title}
        </h3>
        {song.verificationStatus === 'pending' ? (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
            Pending • {Math.max(0, ((song.upvotes || 0) - (song.downvotes || 0)))}/3
          </Badge>
        ) : song.verificationStatus === 'artist_verified' ? (
          <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
            Artist Verified
          </Badge>
        ) : null} 