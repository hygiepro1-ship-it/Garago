import { Composition } from "remotion";
import { DURATION, FPS, ReservationEnLigne } from "./Video";
import { ReservationEnLigne3D } from "./Video3D";

const size = { durationInFrames: DURATION, fps: FPS, width: 1920, height: 1080 };

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="ReservationEnLigne" component={ReservationEnLigne} defaultProps={{ lang: "fr" as const }} {...size} />
      <Composition id="ReservationEnLigne3D" component={ReservationEnLigne3D} defaultProps={{ lang: "fr" as const }} {...size} />
      <Composition id="OnlineBooking" component={ReservationEnLigne} defaultProps={{ lang: "en" as const }} {...size} />
      <Composition id="OnlineBooking3D" component={ReservationEnLigne3D} defaultProps={{ lang: "en" as const }} {...size} />
    </>
  );
};
