// Claude API 호출 래퍼
// 모든 AI 호출은 이 파일을 통해서만 실행
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// 진단은 짧은 설명이라 빠르고 저렴한 Haiku 사용 / 문제 생성은 품질 위해 Sonnet 유지
const DIAGNOSIS_MODEL = "claude-haiku-4-5";
const MODEL = "claude-sonnet-4-5";

// 시스템 프롬프트는 매 호출 동일 → prompt caching으로 입력 처리 시간/비용 절감
const DIAGNOSIS_SYSTEM = `당신은 국가자격증 시험 전문 AI 튜터입니다.
학생이 왜 틀렸는지를 친절하고 구체적으로 설명해주세요.
다음 규칙을 따르세요:
1. 학생이 고른 오답이 왜 틀린지 설명
2. 정답이 왜 맞는지 핵심 개념 설명
3. 이 오개념을 고치려면 어떤 개념을 복습해야 하는지 안내
4. 200자 이내로 간결하게`;

function diagnosisUserMessage(
  questionBody: string,
  correctAnswer: string,
  wrongAnswer: string,
  misconceptionName?: string
) {
  return `문제: ${questionBody}
정답: ${correctAnswer}
학생이 고른 오답: ${wrongAnswer}
${misconceptionName ? `관련 오개념: ${misconceptionName}` : ""}
왜 틀렸는지 진단해주세요.`;
}

export async function generateDiagnosis(
  questionBody: string,
  correctAnswer: string,
  wrongAnswer: string,
  misconceptionName?: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: DIAGNOSIS_MODEL,
    max_tokens: 350,
    system: [
      {
        type: "text",
        text: DIAGNOSIS_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: diagnosisUserMessage(
          questionBody,
          correctAnswer,
          wrongAnswer,
          misconceptionName
        ),
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text"
    ? textBlock.text
    : "진단을 생성하지 못했습니다.";
}

// 스트리밍 진단: 토큰을 받는 즉시 흘려보내 체감 속도를 크게 향상
export function diagnosisStream(
  questionBody: string,
  correctAnswer: string,
  wrongAnswer: string,
  misconceptionName?: string
) {
  return anthropic.messages.stream({
    model: DIAGNOSIS_MODEL,
    max_tokens: 350,
    system: [
      {
        type: "text",
        text: DIAGNOSIS_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: diagnosisUserMessage(
          questionBody,
          correctAnswer,
          wrongAnswer,
          misconceptionName
        ),
      },
    ],
  });
}

export async function generateQuestions(
  topic: string,
  difficulty: number,
  count: number,
  certName: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: `당신은 ${certName} 시험 출제 전문가입니다.
주어진 주제와 난이도에 맞는 객관식 문제를 JSON 형식으로 생성하세요.
각 문제는 4개 보기, 정답 1개, 해설을 포함해야 합니다.
반드시 유효한 JSON만 출력하세요.`,
    messages: [
      {
        role: "user",
        content: `주제: ${topic}
난이도: ${difficulty} (1=쉬움, 2=보통, 3=어려움)
문제 수: ${count}개
JSON 형식: [{ "body": "문제내용", "explanation": "해설", "options": [{"text": "보기1", "is_correct": false}, ...] }]`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "[]";
}
