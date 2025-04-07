import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Wand2 } from "lucide-react"

interface Submission {
  id: number;
  bountyId: number;
  submitter: string;
  proofCID: string;
  comments?: string;
}

interface QualityCheckPanelProps {
  submission: Submission;
  onQualityCheck: (score: number, feedback: string) => void;
  isSubmitter: boolean;
  bountyAmount: string;
  isApproved: boolean;
}

interface QualityCheckResult {
  score: number;
  feedback: string;
  analysis: string;
  rewardSuggestion: {
    percentage: number;
    explanation: string;
  };
}

export default function QualityCheckPanel({
  submission,
  onQualityCheck,
  isSubmitter,
  bountyAmount,
  isApproved
}: QualityCheckPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QualityCheckResult | null>(null);

  const checkQuality = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default form submission
    setLoading(true);
    try {
      const response = await fetch('/api/analyze-quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: submission.id,
          bountyId: submission.bountyId,
          ipfsHash: submission.proofCID,
          comments: submission.comments,
          bountyAmount
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check quality');
      }

      const data = await response.json();
      setResult(data);
      onQualityCheck(data.score, data.feedback);
    } catch (error: unknown) {
      console.error('Error checking quality:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Quality Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result ? (
          <Button
            type="button"
            onClick={checkQuality}
            disabled={loading || isSubmitter || isApproved}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Quality...
              </>
            ) : (
              'Run Quality Check'
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Quality Score</h3>
              <p className="text-sm text-muted-foreground">{result.score}/100</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Reward Suggestion</h3>
              <p className="text-sm text-muted-foreground">
                {result.rewardSuggestion.percentage}% of bounty amount
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {result.rewardSuggestion.explanation}
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Detailed Feedback</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {result.feedback}
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Full Analysis</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {result.analysis}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 