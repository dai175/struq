import { useCallback, useState } from "react";
import { clientLogger } from "@/lib/client-logger";
import { RATE_LIMIT_ERROR } from "@/lib/rate-limit";
import { generateSectionsInputSchema } from "@/lib/schemas";
import type { SectionData } from "@/songs/components/SectionRow";
import { generateSections } from "@/songs/server-fns";

export function useAiGenerate(onResult: (sections: SectionData[]) => void) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const execute = useCallback(
    async (input: { title: string; artist: string; key: string }) => {
      setShowConfirm(false);
      setGenerating(true);
      setError(false);
      setRateLimited(false);
      try {
        const aiInput = generateSectionsInputSchema.parse({
          title: input.title.trim(),
          artist: input.artist.trim(),
          key: input.key.trim() || undefined,
        });
        const sections = await generateSections({ data: aiInput });
        onResult(sections);
      } catch (err) {
        clientLogger.error("generateSections", err);
        if (err instanceof Error && err.message === RATE_LIMIT_ERROR) {
          setRateLimited(true);
        } else {
          setError(true);
        }
      } finally {
        setGenerating(false);
      }
    },
    [onResult],
  );

  return {
    generating,
    error,
    rateLimited,
    showConfirm,
    setShowConfirm,
    execute,
  };
}
