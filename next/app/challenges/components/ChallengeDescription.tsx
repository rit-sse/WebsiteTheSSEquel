"use client";

export function ChallengeDescription() {
    // placeholder for zustand state
    const { challengeNumber, challengeName, problemState, problemText } = {
        challengeNumber: 128,
        challengeName: "Two Sum",
        problemState: "attempted",
        problemText: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]

Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]`
    };

    return (
        <div className="flex flex-col flex-shrink-0 border-4 bg-white/[0.65] dark:bg-black/[0.65] border-white dark:border-black rounded-3xl overflow-hidden">
            <div className="flex flex-row justify-between bg-white dark:bg-black px-6 py-4">
                <span className="text-2xl font-bold">{`${challengeNumber}. ${challengeName}`}</span>
            </div>
            <div className="text-base p-6">
                <pre className="whitespace-pre-wrap">{problemText}</pre>
            </div>
        </div>
    );
}