import { PixelArt } from './PixelArt';
import { petSpriteData, type PetSpecies } from './pixelData';

export type PetState = 'daily' | 'gray' | 'cheer';

type PetSpriteProps = {
  species: PetSpecies;
  state?: PetState;
  size?: number;
  className?: string;
  title?: string;
};

export function PetSprite({ species, state = 'daily', size = 160, className, title }: PetSpriteProps) {
  const data = petSpriteData[species] ?? petSpriteData.cat;
  const palette = state === 'gray' ? data.gray : state === 'cheer' ? data.cheer : data.daily;
  return (
    <PixelArt
      map={data.map}
      palette={palette}
      size={size}
      className={className}
      title={title ?? `小信伙伴·${data.label}`}
    />
  );
}
