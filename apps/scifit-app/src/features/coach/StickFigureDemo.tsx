import Svg, { Circle, Line } from 'react-native-svg';

export function StickFigureDemo({ exercise, tick }: { exercise: string; tick: number }) {
  const phase = (Math.sin(tick / 4) + 1) / 2;
  const centerX = 140;
  const shoulderY = 55;
  const hipYBase = 120;

  const isLowerBody = exercise === 'Back Squat' || exercise === 'Deadlift';
  const hipDrop = isLowerBody ? phase * 34 : 0;
  const kneeBend = isLowerBody ? phase * 18 : 6;
  const armRaise = !isLowerBody ? phase * 26 : 0;

  const hipY = hipYBase + hipDrop;
  const leftKnee = { x: centerX - 24, y: 170 - kneeBend };
  const rightKnee = { x: centerX + 24, y: 170 - kneeBend };
  const leftAnkle = { x: centerX - 24, y: 212 };
  const rightAnkle = { x: centerX + 24, y: 212 };

  const leftShoulder = { x: centerX - 20, y: shoulderY };
  const rightShoulder = { x: centerX + 20, y: shoulderY };
  const leftElbow = { x: centerX - 34, y: 92 - armRaise };
  const rightElbow = { x: centerX + 34, y: 92 - armRaise };
  const leftWrist = { x: centerX - 40, y: 124 - armRaise * 1.2 };
  const rightWrist = { x: centerX + 40, y: 124 - armRaise * 1.2 };

  return (
    <Svg width="100%" height="240" viewBox="0 0 280 240">
      <Circle cx={centerX} cy={32} r={14} fill="#8cd8ff" />

      <Line x1={centerX} y1={46} x2={centerX} y2={hipY} stroke="#7ed1ff" strokeWidth={5} strokeLinecap="round" />
      <Line x1={leftShoulder.x} y1={leftShoulder.y} x2={rightShoulder.x} y2={rightShoulder.y} stroke="#7ed1ff" strokeWidth={5} strokeLinecap="round" />

      <Line x1={leftShoulder.x} y1={leftShoulder.y} x2={leftElbow.x} y2={leftElbow.y} stroke="#7ed1ff" strokeWidth={5} strokeLinecap="round" />
      <Line x1={leftElbow.x} y1={leftElbow.y} x2={leftWrist.x} y2={leftWrist.y} stroke="#7ed1ff" strokeWidth={5} strokeLinecap="round" />
      <Line x1={rightShoulder.x} y1={rightShoulder.y} x2={rightElbow.x} y2={rightElbow.y} stroke="#7ed1ff" strokeWidth={5} strokeLinecap="round" />
      <Line x1={rightElbow.x} y1={rightElbow.y} x2={rightWrist.x} y2={rightWrist.y} stroke="#7ed1ff" strokeWidth={5} strokeLinecap="round" />

      <Line x1={centerX} y1={hipY} x2={leftKnee.x} y2={leftKnee.y} stroke="#7ed1ff" strokeWidth={5} strokeLinecap="round" />
      <Line x1={leftKnee.x} y1={leftKnee.y} x2={leftAnkle.x} y2={leftAnkle.y} stroke="#7ed1ff" strokeWidth={5} strokeLinecap="round" />
      <Line x1={centerX} y1={hipY} x2={rightKnee.x} y2={rightKnee.y} stroke="#7ed1ff" strokeWidth={5} strokeLinecap="round" />
      <Line x1={rightKnee.x} y1={rightKnee.y} x2={rightAnkle.x} y2={rightAnkle.y} stroke="#7ed1ff" strokeWidth={5} strokeLinecap="round" />
    </Svg>
  );
}
