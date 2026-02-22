export const chunkQuestions = <T>(questions: T[], perPage: number) => {
  if (perPage <= 0) return [questions];
  const pages: T[][] = [];
  for (let i = 0; i < questions.length; i += perPage) {
    pages.push(questions.slice(i, i + perPage));
  }
  return pages;
};
