import type { Strategy } from "@/types";

interface MysticBoxVisualProps {
  strategy: Strategy;
  className?: string;
  opening?: boolean;
}

export function MysticBoxVisual({
  strategy,
  className = "",
  opening = false,
}: MysticBoxVisualProps) {
  return (
    <div
      className={`mystic-box mystic-box--${strategy} ${opening ? "is-opening" : ""} ${className}`}
      aria-hidden
    >
      <div className="mystic-shape mystic-shape--cube">
        <div className="mystic-cube-face">
          <div className="mystic-inner-sphere">
            <div className="mystic-waveform mystic-waveform--h" />
          </div>
          <div className="mystic-side-wave" />
        </div>
        <div className="mystic-float-note mystic-float-note--cube">♪</div>
        <div className="mystic-trail mystic-trail--cube" />
      </div>

      <div className="mystic-shape mystic-shape--cylinder">
        <div className="mystic-cylinder-jar">
          <div className="mystic-cylinder-lid" />
          <div className="mystic-cylinder-body">
            <div className="mystic-inner-heart" />
            <div className="mystic-eq-bars">
              <span /><span /><span /><span /><span />
            </div>
          </div>
        </div>
        <div className="mystic-orbit mystic-orbit--a" />
        <div className="mystic-orbit mystic-orbit--b" />
        <div className="mystic-orbit-dot mystic-orbit-dot--a" />
        <div className="mystic-orbit-dot mystic-orbit-dot--b" />
      </div>

      <div className="mystic-shape mystic-shape--egg">
        <div className="mystic-egg-vessel">
          <div className="mystic-egg-cloud">
            <span className="mystic-egg-note">♪</span>
          </div>
          <div className="mystic-egg-dial">
            <div className="mystic-egg-dial-ring">
              <div className="mystic-waveform mystic-waveform--circle" />
            </div>
          </div>
        </div>
        <div className="mystic-orbit mystic-orbit--egg-a" />
        <div className="mystic-orbit mystic-orbit--egg-b" />
      </div>
    </div>
  );
}
