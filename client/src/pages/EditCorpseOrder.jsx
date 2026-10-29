import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { 
  Card, 
  Input, 
  DatePicker, 
  Select, 
  Button, 
  Table, 
  Typography, 
  Row, 
  Col, 
  Space, 
  message 
} from 'antd'
import { 
  OrderedListOutlined, 
  SearchOutlined, 
  SaveOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography
const { Option } = Select

export default function EditCorpseOrder() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const [selectedYear, setSelectedYear] = useState('2569')
  const [cutoffDate, setCutoffDate] = useState(null)
  const [deceasedList, setDeceasedList] = useState([])

  // โหลดรายชื่อผู้เสียชีวิตทั้งหมดจาก LocalStorage แบบซิงค์ปัจจุบัน
  const loadDeceasedMembers = () => {
    const rawMembers = JSON.parse(localStorage.getItem('funeral_members')) || 
                       JSON.parse(localStorage.getItem('members')) || []

    // กรองเฉพาะสมาชิกที่มีสถานะเสียชีวิต หรือมีวันที่เสียชีวิต
    const deceased = rawMembers.filter(m => m.status === 'เสียชีวิต' || m.deathDate)

    const formatted = deceased.map((m, index) => ({
      key: m.memberId || m.code || index.toString(),
      memberId: m.memberId || m.code || '-',
      memberName: m.name || m.memberName || 'ไม่ระบุชื่อ',
      group: m.group || '0',
      corpseNo: m.corpseNo || String(index + 1),
      deathDate: m.deathDate || dayjs().format('YYYY-MM-DD')
    }))

    setDeceasedList(formatted)
  }

  useEffect(() => {
    loadDeceasedMembers()
  }, [])

  const handleShowData = () => {
    loadDeceasedMembers()
    message.success('ซิงค์และแสดงข้อมูลลำดับศพปัจจุบันเรียบร้อยแล้ว')
  }

  const handleCorpseNoChange = (key, newNo) => {
    const updated = deceasedList.map(item => {
      if (item.key === key) {
        return { ...item, corpseNo: newNo }
      }
      return item
    })
    setDeceasedList(updated)
  }

  const handleSaveOrder = () => {
    const rawMembers = JSON.parse(localStorage.getItem('funeral_members')) || 
                       JSON.parse(localStorage.getItem('members')) || []

    const updatedMembers = rawMembers.map(m => {
      const mId = String(m.memberId || m.code || '')
      const foundInEdit = deceasedList.find(d => d.key === mId)
      if (foundInEdit) {
        return { ...m, corpseNo: foundInEdit.corpseNo }
      }
      return m
    })

    localStorage.setItem('funeral_members', JSON.stringify(updatedMembers))
    localStorage.setItem('members', JSON.stringify(updatedMembers))
    message.success('บันทึกลำดับศพใหม่และซิงค์ข้อมูลลงระบบเรียบร้อยแล้ว!')
    loadDeceasedMembers()
  }

  const columns = [
    { title: 'ลำดับศพ', dataIndex: 'corpseNo', key: 'corpseNo', align: 'center', width: 100,
      render: (text, record) => (
        <Input 
          value={text} 
          onChange={(e) => handleCorpseNoChange(record.key, e.target.value)} 
          style={{ textAlign: 'center', fontWeight: 'bold' }} 
        />
      )
    },
    { title: 'เลขที่สมาชิก', dataIndex: 'memberId', key: 'memberId', align: 'center', width: 120 },
    { title: 'ชื่อ - นามสกุล', dataIndex: 'memberName', key: 'memberName', width: 220 },
    { title: 'กลุ่ม', dataIndex: 'group', key: 'group', align: 'center', width: 80 },
    { title: 'วันที่เสียชีวิต', dataIndex: 'deathDate', key: 'deathDate', align: 'center', width: 130, render: v => v ? dayjs(v).format('DD/MM/YYYY') : '-' }
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40, padding: '16px' }}>
      
      <Card 
        title={<Space><OrderedListOutlined style={{ color: primaryColor }} /><span>แก้ไขลำดับศพใหม่</span></Space>}
        style={{ borderRadius: 8, marginBottom: 16, borderLeft: `4px solid ${primaryColor}` }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={6}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>ปี</Text>
            <Select value={selectedYear} onChange={setSelectedYear} style={{ width: '100%' }} size="large">
              <Option value="2569">2569</Option>
              <Option value="2568">2568</Option>
              <Option value="2567">2567</Option>
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>วันที่ตัดยอด</Text>
            <DatePicker value={cutoffDate} onChange={setCutoffDate} format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
          </Col>
          <Col xs={24} md={6} style={{ paddingTop: 22 }}>
            <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleShowData} style={{ background: primaryColor, width: '100%' }}>
              แสดงข้อมูล
            </Button>
          </Col>
        </Row>

        <div style={{ marginTop: 12 }}>
          <Text type="secondary">หมายเหตุ 1: ไม่ใส่วันที่คือแสดงทั้งหมดตั้งแต่ต้นปี</Text><br />
          <Text type="secondary">หมายเหตุ 2: ถ้าลำดับต่อเนื่องให้ใส่เฉพาะแถวแรกพอ โดยใช้เมาส์ดับเบิลคลิก</Text>
        </div>
      </Card>

      <Card style={{ borderRadius: 8, marginBottom: 16 }}>
        <Table 
          dataSource={deceasedList} 
          columns={columns} 
          pagination={{ pageSize: 10 }} 
          size="small" 
          bordered 
          locale={{ emptyText: 'ยังไม่มีข้อมูลผู้เสียชีวิตในระบบ (แสดง 0 รายการ)' }}
        />
      </Card>

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSaveOrder} style={{ background: primaryColor, paddingInline: 32 }}>
            บันทึกลำดับศพใหม่
          </Button>
        </Space>
      </div>

    </div>
  )
}