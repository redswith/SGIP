CREATE TABLE problem_comments (
  id BIGSERIAL PRIMARY KEY,
  problem_id BIGINT NOT NULL REFERENCES problems(id),
  author_id BIGINT NOT NULL REFERENCES app_users(id),
  content TEXT NOT NULL,
  visibility VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_problem_comments_problem ON problem_comments(problem_id,created_at);
