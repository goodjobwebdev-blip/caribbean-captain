import {useState} from 'react';
import {port, type PortId} from './world';

// Public assets use Vite's base so project-site GitHub Pages URLs work too.
export function harbourArtUrl(id: PortId, size: 640 | 1280) {
  return `${import.meta.env.BASE_URL}images/harbours/${id}-${size}.webp`;
}

export function HarbourArt({id}: {id: PortId}) {
  return <HarbourImage key={id} id={id}/>;
}

function HarbourImage({id}: {id: PortId}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img className="harbour-art"
    src={harbourArtUrl(id, 1280)}
    srcSet={`${harbourArtUrl(id, 640)} 640w, ${harbourArtUrl(id, 1280)} 1280w`}
    sizes="(max-width: 720px) calc(100vw - 88px), (max-width: 1360px) calc(100vw - 382px), 978px"
    width={1280} height={640}
    alt={`Painted view of ${port(id).name} harbour, ${port(id).island}`}
    decoding="async" onError={()=>setFailed(true)}/>;
}
