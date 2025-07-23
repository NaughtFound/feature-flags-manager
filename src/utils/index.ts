export const topologicalSort = (adjMatrix: number[][]): number[] => {
  const n = adjMatrix.length;
  const inDegree: number[] = new Array(n).fill(0);
  const queue: number[] = [];
  const order: number[] = [];

  for (let col = 0; col < n; col++) {
    for (let row = 0; row < n; row++) {
      inDegree[col] += adjMatrix[row][col];
    }
  }

  for (let i = 0; i < n; i++) {
    if (inDegree[i] == 0) {
      queue.push(i);
    }
  }

  while (queue.length > 0) {
    const u = queue.shift()!;

    order.push(u);

    for (let v = 0; v < n; v++) {
      if (adjMatrix[u][v] == 0) continue;
      inDegree[v]--;
      if (inDegree[v] == 0) queue.push(v);
    }
  }

  return order;
};
