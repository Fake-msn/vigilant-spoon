type PixelArtProps = {
  map: string[];
  palette: Record<string, string>;
  size?: number;
  className?: string;
  title?: string;
};

export function PixelArt({ map, palette, size = 160, className, title }: PixelArtProps) {
  const rows = map.length;
  const cols = map[0].length;
  const rects: React.ReactNode[] = [];
  map.forEach((row, y) => {
    row.split('').forEach((ch, x) => {
      const fill = palette[ch];
      if (fill) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fill} />);
      }
    });
  });
  return (
    <svg
      viewBox={`-0.5 -0.5 ${cols + 1} ${rows + 1}`}
      width={size}
      height={size * (rows / cols)}
      className={`pixelated ${className ?? ''}`}
      role="img"
      aria-label={title}
      shapeRendering="crispEdges"
    >
      {title && <title>{title}</title>}
      {rects}
    </svg>
  );
}
