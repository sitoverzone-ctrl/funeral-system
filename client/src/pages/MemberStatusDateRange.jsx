import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { 
  Card, 
  DatePicker, 
  Button, 
  Table, 
  Typography, 
  Row, 
  Col, 
  Space, 
  message 
} from 'antd'
import { 
  CalendarOutlined, 
  SearchOutlined, 
  PrinterOutlined, 
  CheckSquareOutlined, 
  SafetyCertificateOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography

export default function MemberStatusDateRange() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const [fromDate, setFromDate] = useState(null)
  const [toDate, setToDate] = useState(null)
  const [adjustDate, setAdjustDate] = useState(dayjs())

  const [membersList, setMembersList] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])

  const loadAllMembers = () => {
    const rawMembers = JSON.parse(localStorage.getItem('funeral_members')) || 
                       JSON.parse(localStorage.getItem('members')) || []

    const formatted = rawMembers.map((m, index) => ({
      key: m.key || m.memberId || m.code || index.toString(),
      memberId: m.memberId || m.code || m.id || `M${index + 1}`,
      memberName: m.memberName || m.name || m.fullname || 'ไม่ระบุชื่อ',
      group: m.group || m.villageGroup || '1',
      regDate: m.regDate || dayjs().format('YYYY-MM-DD'),
      startCoverDate: m.startCoverDate || dayjs().format('YYYY-MM-DD'),
      coverStatus: m.coverStatus || 'สมาชิกใหม่' // ค่าเริ่มต้นให้เป็นสมาชิกใหม่ถ้ายังไม่ได้ระบุ
    }))

    setMembersList(formatted)
  }

  useEffect(() => {
    loadAllMembers()
  }, [])

  const handleShowData = () => {
    if (!fromDate || !toDate) {
      message.warning('กรุณาระบุช่วงวันที่ที่จะได้รับสิทธิตั้งแต่ - ถึงวันที่ ให้ครบถ้วน')
      return
    }

    const start = dayjs(fromDate).startOf('day')
    const end = dayjs(toDate).endOf('day')

    // กรองเฉพาะสมาชิกที่อยู่ในช่วงวันที่ และสถานะเป็น "สมาชิกใหม่" เท่านั้น (ไม่แสดงคนที่ได้รับความคุ้มครองแล้ว)
    const matched = membersList.filter(item => {
      const itemDate = dayjs(item.startCoverDate || item.regDate)
      const isInDateRange = (itemDate.isAfter(start) || itemDate.isSame(start)) && 
                            (itemDate.isBefore(end) || itemDate.isSame(end))
      
      const isNewMemberStatus = !item.coverStatus || 
                                item.coverStatus === 'สมาชิกใหม่' || 
                                item.coverStatus.includes('ใหม่')

      return isInDateRange && isNewMemberStatus
    })

    setFilteredData(matched)
    setSelectedRowKeys(matched.map(i => i.key))
    message.success(`พบสมาชิกใหม่ที่รอรับสิทธิ์จำนวน ${matched.length} ราย`)
  }

  const handleSelectAll = () => {
    if (selectedRowKeys.length === filteredData.length) {
      setSelectedRowKeys([])
    } else {
      setSelectedRowKeys(filteredData.map(item => item.key))
    }
  }

  const handlePrint = () => {
    if (filteredData.length === 0) {
      message.warning('ไม่มีข้อมูลสำหรับพิมพ์รายงาน')
      return
    }
    window.print()
  }

  const handleAdjustRights = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('กรุณาเลือกรายการสมาชิกอย่างน้อย 1 รายเพื่อปรับสิทธิ')
      return
    }

    if (!adjustDate) {
      message.error('กรุณาระบุวันที่ปรับสิทธิ (สำคัญมาก เพราะต้องใช้หักชำระ)')
      return
    }

    const rawMembers = JSON.parse(localStorage.getItem('funeral_members')) || 
                       JSON.parse(localStorage.getItem('members')) || []

    const adjustDateStr = adjustDate.format('YYYY-MM-DD')

    const updated = rawMembers.map(m => {
      const mId = String(m.memberId || m.code || m.id)
      if (selectedRowKeys.includes(mId) || selectedRowKeys.some(k => String(k) === mId)) {
        return {
          ...m,
          startCoverDate: adjustDateStr,
          newCoverDate: adjustDateStr,
          coverStatus: 'ได้รับความคุ้มครอง' // เปลี่ยนสถานะเป็นได้รับความคุ้มครองเมื่อกดปรับสิทธิแล้ว
        }
      }
      return m
    })

    localStorage.setItem('funeral_members', JSON.stringify(updated))
    localStorage.setItem('members', JSON.stringify(updated))
    message.success(`ปรับสิทธิสมาชิกสำเร็จจำนวน ${selectedRowKeys.length} ราย (วันที่ปรับสิทธิ: ${adjustDate.format('DD/MM/YYYY')})`)
    
    // โหลดข้อมูลใหม่เพื่อกรองรายชื่อที่ปรับสิทธิไปแล้วออก
    loadAllMembers()
    setFilteredData([])
    setSelectedRowKeys([])
  }

  const columns = [
    { title: 'เลขที่สมาชิก', dataIndex: 'memberId', key: 'memberId', align: 'center', width: 100 },
    { title: 'ชื่อ - นามสกุล', dataIndex: 'memberName', key: 'memberName', width: 200 },
    { title: 'กลุ่ม', dataIndex: 'group', key: 'group', align: 'center', width: 80 },
    { title: 'วันที่เริ่มคุ้มครอง', dataIndex: 'startCoverDate', key: 'startCoverDate', align: 'center', width: 130, render: v => v ? dayjs(v).format('DD/MM/YYYY') : '-' },
    { title: 'สถานะสิทธิ', dataIndex: 'coverStatus', key: 'coverStatus', align: 'center', width: 140 }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40, padding: '16px' }}>
      
      <Card 
        title={<Space><CalendarOutlined style={{ color: primaryColor }} /><span>ปรับสิทธิสมาชิกตามช่วงวันที่ (เฉพาะสมาชิกใหม่)</span></Space>}
        style={{ borderRadius: 8, marginBottom: 16, borderLeft: `4px solid ${primaryColor}` }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={18}>
            <Space size="middle" wrap>
              <Text strong>วันที่ที่จะได้รับสิทธิตั้งแต่:</Text>
              <DatePicker value={fromDate} onChange={setFromDate} format="DD/MM/YYYY" placeholder="DD/MM/YYYY" style={{ width: 140 }} />
              <Text strong>ถึงวันที่:</Text>
              <DatePicker value={toDate} onChange={setToDate} format="DD/MM/YYYY" placeholder="DD/MM/YYYY" style={{ width: 140 }} />
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleShowData} style={{ background: primaryColor, width: '100%' }}>
              แสดงข้อมูล
            </Button>
          </Col>

          <Col xs={24} md={24}>
            <Space size="middle" align="center">
              <Text strong>วันที่ปรับสิทธิ:</Text>
              <DatePicker value={adjustDate} onChange={setAdjustDate} format="DD/MM/YYYY" style={{ width: 150 }} />
              <Text type="danger" strong>(วันที่ปรับสิทธิ สำคัญมาก เพราะต้องใช้หักชำระ)</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      <div id="printable-report" style={{ background: '#fff', padding: 8 }}>
        <div className="print-header" style={{ textAlign: 'center', marginBottom: 16, display: 'none' }}>
          <Text strong style={{ fontSize: 16 }}>รายงานปรับสิทธิสมาชิกใหม่ตามช่วงวันที่</Text>
        </div>

        <Table 
          dataSource={filteredData} 
          columns={columns} 
          rowSelection={rowSelection}
          pagination={{ pageSize: 10 }} 
          size="small" 
          bordered 
          locale={{ emptyText: 'ยังไม่ได้เลือกช่วงวันที่ หรือไม่มีสมาชิกใหม่ในช่วงเวลานี้' }}
        />
      </div>

      <Card className="no-print" size="small" style={{ marginTop: 16, borderRadius: 8, background: '#f8fafc' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <Text>จำนวนสมาชิกใหม่: <strong style={{ color: primaryColor, fontSize: 16 }}>{filteredData.length}</strong> ราย (เลือก: <strong style={{ color: '#059669' }}>{selectedRowKeys.length}</strong>)</Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<CheckSquareOutlined />} onClick={handleSelectAll}>
                เลือกทั้งหมด
              </Button>
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                พิมพ์
              </Button>
              <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={handleAdjustRights} style={{ background: '#059669' }}>
                ปรับสิทธิ
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <style>{`
        @media print {
          html, body {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          header, 
          .no-print {
            display: none !important;
          }
          .print-header {
            display: block !important;
          }
          #printable-report {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

    </div>
  )
}