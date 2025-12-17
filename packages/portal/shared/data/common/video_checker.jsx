import React from 'react';
import ReactPlayer from 'react-player';

const VideoChecker = ({ url, width, height }) => {
  const checkVideoPlatform = (url) => {
    if(url){
      const parsedUrl = new URL(url);
      if (
        parsedUrl.hostname.includes('youtube.com') ||
        parsedUrl.hostname.includes('youtu.be')
      ) {
        return 'YouTube';
      } else if (parsedUrl.hostname.includes('vimeo.com')) {
        return 'Vimeo';
      } else {
        return 'Unknown';
      }
    }else {
      return 'Unknown';
    }
  };

  const platform = checkVideoPlatform(url);

  return (
    <div> 
      {platform !== 'Unknown' && (
        <ReactPlayer url={url} controls width={width} height={height} />
      )} 

      {platform === 'Unknown' && (
        <p>Unsupported video platform. Unable to embed the video.</p>
      )}
    </div>
  );
};

export default VideoChecker;