import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

interface BarItem {
  label: string
  value: number
  id?: number
}

interface Props {
  data: BarItem[]
  onBarClick?: (item: BarItem) => void
}

export default function HorizontalBarChart({ data, onBarClick }: Props) {
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        data: data.map(d => d.value),
        backgroundColor: '#16A34A',
        borderRadius: 3,
        barThickness: 20,
      }
    ]
  }

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { x: number } }) => `${ctx.parsed.x.toLocaleString()} hits`
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { precision: 0 },
        grid: { display: false }
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 12 },
          color: '#6B7280',
          callback: function(_: unknown, index: number) {
            const label = data[index]?.label || ''
            return label.length > 40 ? label.substring(0, 37) + '...' : label
          }
        }
      }
    },
    onClick: (_event: unknown, elements: { index: number }[]) => {
      if (onBarClick && elements.length > 0) {
        onBarClick(data[elements[0].index])
      }
    }
  }

  const height = Math.max(300, data.length * 28)

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
