/** In-memory quarantine queue for suspicious actions pending elevated review. */
type QuarantinedItem = {
  id:          string;
  request:     Record<string, unknown>;
  riskScore:   number;
  enqueuedAt:  string;
};

const queue: QuarantinedItem[] = [];
let _seq = 0;

export const actionQuarantine = {
  enqueue(request: Record<string, unknown>, riskScore: number): string {
    const id = `q-${Date.now()}-${++_seq}`;
    queue.push({ id, request, riskScore, enqueuedAt: new Date().toISOString() });
    return id;
  },

  drain(): QuarantinedItem[] {
    return queue.splice(0);
  },

  peek(): QuarantinedItem[] {
    return [...queue];
  },

  size(): number {
    return queue.length;
  },
};
