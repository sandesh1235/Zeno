import { Text as RNText, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

export type LineChartPoint = { x: number; y: number; label: string };

export function LineChart({ points, width, height, color, gridColor, mutedColor, formatY, emptyLabel }: {
  points: LineChartPoint[];
  width: number;
  height: number;
  color: string;
  gridColor: string;
  mutedColor: string;
  formatY?: (v: number) => string;
  emptyLabel?: string;
}) {
  if (points.length === 0) {
    return <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      <RNText style={{ color: mutedColor, fontSize: 12 }}>{emptyLabel ?? 'No data yet'}</RNText>
    </View>;
  }

  const pad = { top: 18, right: 8, bottom: 22, left: 8 };
  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);

  const ys = points.map(p => p.y);
  let minY = Math.min(...ys), maxY = Math.max(...ys);
  if (minY === maxY) { minY -= 1; maxY += 1; }

  const xs = points.map(p => p.x);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const spanX = maxX - minX || 1;

  const scaleX = (x: number) => points.length === 1 ? pad.left + innerW / 2 : pad.left + ((x - minX) / spanX) * innerW;
  const scaleY = (y: number) => pad.top + innerH - ((y - minY) / (maxY - minY)) * innerH;

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x).toFixed(1)} ${scaleY(p.y).toFixed(1)}`).join(' ');
  const showDots = points.length <= 24;

  return <Svg width={width} height={height}>
    <Line x1={pad.left} y1={pad.top + innerH} x2={pad.left + innerW} y2={pad.top + innerH} stroke={gridColor} strokeWidth={1} />
    {formatY && <SvgText x={pad.left} y={pad.top - 6} fontSize={10} fontWeight="700" fill={color}>{formatY(maxY)}</SvgText>}
    <Path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {showDots && points.map((p, i) => <Circle key={i} cx={scaleX(p.x)} cy={scaleY(p.y)} r={3.5} fill={color} />)}
    <SvgText x={pad.left} y={height - 6} fontSize={10} fill={mutedColor}>{points[0].label}</SvgText>
    {points.length > 1 && <SvgText x={pad.left + innerW} y={height - 6} fontSize={10} fill={mutedColor} textAnchor="end">{points[points.length - 1].label}</SvgText>}
  </Svg>;
}
