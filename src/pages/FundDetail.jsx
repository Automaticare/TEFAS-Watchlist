import { useParams } from 'react-router-dom'

function FundDetail() {
  const { fundCode } = useParams()

  return (
    <div>
      <h2>Fon Detay: {fundCode}</h2>
      <p>Fon detayları burada görüntülenecek.</p>
    </div>
  )
}

export default FundDetail
