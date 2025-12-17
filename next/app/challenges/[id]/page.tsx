import { cn } from "@/lib/utils";
import Sidebar from "./Sidebar";
import { ChallengeDescription } from "../components/ChallengeDescription";
import Markdown from "../components/ChallengeMarkdown";
import { AttemptCard } from "../components/AttemptCard";
import { SolutionsCard } from "../components/SolutionsCard";
import { ModalProvider } from "../components/ModalProvider";

export type ChallengeState = "attempted" | "solved" | "unattempted" | "revealed";
export type ChallengeType = "current" | "historical";

export type Challenge = {
    id: string;
    title: string;
    type: ChallengeType;
    description: string;
    createdAt: Date;
    state: ChallengeState;
    attempts?: number;
    solution?: {
        code: string;
        language: string;
        submittedAt: Date;
    }
};

async function fetchChallengeData(id: string): Promise<Challenge | null> {
    if (isNaN(Number(id)) || Number(id) < 0) return null;

    return { // get from database 
        id: id,
        title: "Two Sum",
        type: "current",
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in **any** order.

### Example 1:
Input: \`nums = [2,7,11,15], target = 9\`

Output: \`[0,1]\`

Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

### Example 2:
Input: \`nums = [3,2,4], target = 6\`

Output: \`[1,2]\`

### Example 3:
Input: \`nums = [3,3], target = 6\`

Output: \`[0,1]\``,
        createdAt: new Date(),
        state: "unattempted" as const,
    };
}

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const challenge = await fetchChallengeData(id);

    return (
        <>
            <style>
                {`footer { display: none !important; }`}
            </style>
            <ModalProvider>
                <div className={cn(
                    "self-stretch flex flex-row h-0 grow gap-6 px-6 overflow-hidden",
                    "-mx-2 md:-mx-4 lg:-mx-6 xl:-mx-8",
                    "-mb-2 md:-mb-4 lg:-mb-6 xl:-mb-8",
                )}>
                    <Sidebar />

                    {
                        challenge ? (
                            <div className="relative flex grow flex-col min-w-0">
                                <div className="flex grow flex-col gap-6 sse-scrollbar overflow-y-auto pb-52"
                                    style={{
                                        maskImage: 'linear-gradient(to bottom, black calc(100% - 6rem), transparent 100%)',
                                        WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 6rem), transparent 100%)'
                                    }}
                                >
                                    <ChallengeDescription id={challenge.id} title={challenge.title}>
                                        <Markdown content={challenge.description} />
                                    </ChallengeDescription>
                                    <AttemptCard>

                                    </AttemptCard>
                                    <SolutionsCard state={challenge.state} type={challenge.type}>
                                        <div className="p-6"></div>
                                    </SolutionsCard>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-row grow items-center justify-center">
                                <span className="text-base-content/50 italic">Challenge #{id} not found.</span>
                            </div>
                        )
                    }
                </div>
            </ModalProvider>
        </>
    );
}