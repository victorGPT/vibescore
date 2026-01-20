import React, { useEffect, useState } from "react";

import { copy } from "../../../lib/copy";
import { AsciiBox } from "./AsciiBox.jsx";
import { MatrixAvatar } from "./MatrixAvatar.jsx";
import { ScrambleText } from "./ScrambleText.jsx";

export function IdentityCard({
  name = copy("identity_card.name_default"),
  avatarUrl,
  isPublic = false,
  onDecrypt,
  title = copy("identity_card.title_default"),
  subtitle,
  rankLabel,
  streakDays,
  showStats = true,
  animateTitle = true,
  scrambleDurationMs = 2200,
  scrambleLoop = false,
  scrambleLoopDelayMs = 2400,
  scrambleStartScrambled = true,
  scrambleRespectReducedMotion = false,
  scanlines = true,
  className = "",
  avatarSize = 80,
  animate = true,
}) {
  const unknownLabel = copy("identity_card.unknown");
  const displayName = isPublic ? name : unknownLabel;
  const avatarName = isPublic ? name : unknownLabel;
  const [avatarFailed, setAvatarFailed] = useState(false);
  const safeAvatarUrl = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
  const showAvatar = isPublic && safeAvatarUrl && !avatarFailed;
  const rankValue = rankLabel ?? copy("identity_card.rank_placeholder");
  const streakValue = Number.isFinite(Number(streakDays))
    ? copy("identity_card.streak_value", { days: Number(streakDays) })
    : copy("identity_card.rank_placeholder");
  const shouldShowStats =
    showStats && (rankLabel !== undefined || streakDays !== undefined);

  useEffect(() => {
    setAvatarFailed(false);
  }, [safeAvatarUrl]);

  const titleNode =
    typeof title === "string" && animateTitle ? (
      <ScrambleText
        text={title}
        durationMs={scrambleDurationMs}
        loop={scrambleLoop}
        loopDelayMs={scrambleLoopDelayMs}
        startScrambled={scrambleStartScrambled}
        respectReducedMotion={scrambleRespectReducedMotion}
      />
    ) : (
      title
    );

  return (
    <AsciiBox title={titleNode} subtitle={subtitle} className={className}>
      <div className="relative overflow-hidden">
        {scanlines ? (
          <>
            <div className="pointer-events-none absolute inset-0 matrix-scanlines opacity-30 mix-blend-screen"></div>
            <div className="pointer-events-none absolute inset-0 matrix-scan-sweep opacity-20"></div>
          </>
        ) : null}

        <div className="relative z-10 flex items-center space-x-6 px-2">
          {showAvatar ? (
            <div
              style={{ width: avatarSize, height: avatarSize }}
              className="relative p-1 bg-matrix-panelStrong border border-matrix-dim overflow-hidden"
            >
              <img
                src={safeAvatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            </div>
          ) : (
            <MatrixAvatar
              name={avatarName}
              isAnon={!isPublic}
              size={avatarSize}
            />
          )}

          <div className="flex-1 space-y-2">
            <div>
              <div className="text-2xl md:text-3xl font-black text-matrix-bright tracking-tight leading-none">
                {animate ? (
                  <ScrambleText
                    text={displayName}
                    durationMs={scrambleDurationMs}
                    loop={scrambleLoop}
                    loopDelayMs={scrambleLoopDelayMs}
                    startScrambled={scrambleStartScrambled}
                    respectReducedMotion={scrambleRespectReducedMotion}
                  />
                ) : (
                  displayName
                )}
              </div>
            </div>

            {!isPublic && onDecrypt ? (
              <button
                type="button"
                onClick={onDecrypt}
                className="text-caption text-black bg-matrix-primary px-3 py-1 font-bold uppercase hover:bg-white transition-colors"
              >
                {copy("identity_card.decrypt")}
              </button>
            ) : null}

            {shouldShowStats ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-matrix-panel p-2 border border-matrix-ghost text-center">
                  <div className="text-caption text-matrix-muted uppercase font-bold">
                    {copy("identity_card.rank_label")}
                  </div>
                  <div className="text-gold font-black text-body">
                    {rankValue}
                  </div>
                </div>
                <div className="bg-matrix-panel p-2 border border-matrix-ghost text-center">
                  <div className="text-caption text-matrix-muted uppercase font-bold">
                    {copy("identity_card.streak_label")}
                  </div>
                  <div className="text-gold font-black tracking-tight text-body">
                    {streakValue}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AsciiBox>
  );
}
