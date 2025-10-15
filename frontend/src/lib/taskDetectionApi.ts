export interface TaskDetectionRequest {
  message: string;
}

export interface Task {
  task_description: string;
  assignee: string | null;
  deadline: string | null;
  priority: "High" | "Medium" | "Low";
}

export interface TaskDetectionResponse {
  tasks: Task[];
  task_count: number;
  has_tasks: boolean;
  original_message: string;
}

export async function detectTasks(message: string): Promise<TaskDetectionResponse> {
  const response = await fetch('http://127.0.0.1:8002/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
    } as TaskDetectionRequest),
  });

  if (!response.ok) {
    throw new Error(`Task detection API failed: ${response.statusText}`);
  }

  return response.json();
}

export function convertTasksToCSV(tasks: Task[]): string {
  if (tasks.length === 0) {
    return '';
  }

  // CSV Header
  const headers = ['Task Description', 'Assignee', 'Deadline', 'Priority'];
  const csvRows = [headers.join(',')];

  // CSV Data
  tasks.forEach(task => {
    const row = [
      `"${task.task_description.replace(/"/g, '""')}"`, // Escape quotes
      task.assignee ? `"${task.assignee.replace(/"/g, '""')}"` : '""',
      task.deadline ? `"${task.deadline.replace(/"/g, '""')}"` : '""',
      task.priority
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

export function downloadCSV(csvContent: string, filename: string = 'tasks.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}
