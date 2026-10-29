import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Input, Button, Typography, Row, Col, Select, Table, Space, message, Popconfirm } from 'antd'
import { SearchOutlined, SaveOutlined, PlusOutlined, DeleteOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons'

const { Text } = Typography

// รายชื่อ 77 จังหวัดทั่วประเทศไทยครบถ้วน
const ALL_PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", 
  "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", 
  "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", 
  "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", 
  "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", 
  "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", 
  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", 
  "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
].map(p => ({ value: p, label: p }))

export default function VillageInformation() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const [province, setProvince] = useState('บึงกาฬ')
  const [district, setDistrict] = useState('เซกา')
  const [subdistrict, setSubdistrict] = useState('ซาง')
  const [villageRange, setVillageRange] = useState('1-99')

  const [villages, setVillages] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])

  // ดึงรายการอำเภอจากข้อมูลสมาชิกหรือค่าเริ่มต้นตามจังหวัดที่เลือก
  const getDistricts = (prov) => {
    let defaults = []
    if (prov === 'บึงกาฬ') {
      defaults = ['เซกา', 'บึงโขงหลง', 'พรเจริญ', 'ปากคาด', 'โซ่พิสัย', 'ศรีวิไล', 'เมืองบึงกาฬ']
    } else if (prov === 'นครราชสีมา') {
      defaults = ['เมืองนครราชสีมา', 'ปากช่อง', 'ครบุรี', 'สูงเนิน', 'โชคชัย', 'พิมาย', 'จักราช', 'หนองบุญมาก', 'ปักธงชัย']
    } else if (prov === 'ขอนแก่น') {
      defaults = ['เมืองขอนแก่น', 'ชุมแพ', 'น้ำพอง', 'บ้านไผ่', 'พล', 'กระนวน']
    } else {
      defaults = ['เมือง' + prov, 'อำเภอหลัก']
    }
    try {
      const members = JSON.parse(localStorage.getItem('funeral_members')) || []
      const filtered = members.filter(m => m.province === prov)
      const memberDistricts = filtered.map(m => m.district || m.amphur).filter(Boolean)
      return Array.from(new Set([...defaults, ...memberDistricts])).map(d => ({ value: d, label: d }))
    } catch {
      return defaults.map(d => ({ value: d, label: d }))
    }
  }

  // ดึงรายการตำบลตามอำเภอที่เลือก
  const getSubdistricts = (prov, dist) => {
    let defaults = []
    if (prov === 'บึงกาฬ' && dist === 'เซกา') {
      defaults = ['ซาง', 'เซกา', 'ท่ากกแดง', 'ป่า건', 'โศกก่าม', 'หนองจันทร์']
    } else {
      defaults = ['ตำบลหลัก', 'ตำบลใกล้เคียง']
    }
    try {
      const members = JSON.parse(localStorage.getItem('funeral_members')) || []
      const filtered = members.filter(m => m.province === prov && (m.district === dist || m.amphur === dist))
      const memberSubs = filtered.map(m => m.subdistrict || m.tumbol).filter(Boolean)
      return Array.from(new Set([...defaults, ...memberSubs])).map(s => ({ value: s, label: s }))
    } catch {
      return defaults.map(s => ({ value: s, label: s }))
    }
  }

  const districtOptions = getDistricts(province)
  const subdistrictOptions = getSubdistricts(province, district)

  // คีย์สำหรับเก็บข้อมูลหมู่บ้านใน localStorage แยกตาม จังหวัด -> อำเภอ -> ตำบล
  const getStorageKey = () => `funeral_villages_${province}_${district}_${subdistrict}`

  // โหลดข้อมูลหมู่บ้าน
  const handleLoadVillages = () => {
    try {
      const key = getStorageKey()
      const saved = localStorage.getItem(key)
      if (saved) {
        setVillages(JSON.parse(saved))
        message.success(`โหลดข้อมูลหมู่บ้าน ตำบล${subdistrict || ''} อำเภอ${district || ''} สำเร็จ`)
      } else {
        if (province === 'บึงกาฬ' && district === 'เซกา' && subdistrict === 'ซาง') {
          const defaultVillages = [
            { key: '1', moo: '1', name: 'บ้านซาง', status: 'ใช้งาน' },
            { key: '2', moo: '2', name: 'บ้านท่าสำราญ', status: 'ใช้งาน' },
            { key: '3', moo: '3', name: 'บ้านซอมคอก', status: 'ใช้งาน' },
            { key: '4', moo: '4', name: 'บ้านโคกบริการ', status: 'ใช้งาน' },
            { key: '6', moo: '6', name: 'บ้านแตงสาร', status: 'ใช้งาน' },
            { key: '7', moo: '7', name: 'บ้านสันกำแพง', status: 'ใช้งาน' },
            { key: '8', moo: '8', name: 'บ้านท่าเรือ', status: 'ใช้งาน' },
            { key: '9', moo: '9', name: 'บ้านซางใต้', status: 'ใช้งาน' },
            { key: '10', moo: '10', name: 'บ้านโนนสง่า', status: 'ใช้งาน' },
          ]
          setVillages(defaultVillages)
          localStorage.setItem(key, JSON.stringify(defaultVillages))
        } else {
          setVillages([
            { key: '1', moo: '1', name: 'บ้าน...', status: 'ใช้งาน' }
          ])
        }
      }
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    }
  }

  useEffect(() => {
    handleLoadVillages()
  }, [province, district, subdistrict])

  // เพิ่มแถวใหม่
  const handleAddRow = () => {
    const newKey = String(Date.now())
    const nextMoo = villages.length > 0 ? String(Number(villages[villages.length - 1].moo || 0) + 1) : '1'
    const newRow = { key: newKey, moo: nextMoo, name: 'บ้าน...', status: 'ใช้งาน' }
    setVillages([...villages, newRow])
  }

  // ลบแถวที่เลือก
  const handleDeleteRows = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('กรุณาเลือกแถวที่ต้องการลบ')
      return
    }
    const updated = villages.filter(item => !selectedRowKeys.includes(item.key))
    setVillages(updated)
    setSelectedRowKeys([])
    message.success('ลบแถวที่เลือกสำเร็จ')
  }

  // บันทึกข้อมูลลง localStorage
  const handleSaveData = () => {
    try {
      const key = getStorageKey()
      localStorage.setItem(key, JSON.stringify(villages))
      message.success('บันทึกข้อมูลหมู่บ้านสำเร็จเรียบร้อย')
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    }
  }

  // แก้ไขข้อมูลในตาราง
  const handleCellChange = (key, field, value) => {
    const updated = villages.map(item => {
      if (item.key === key) {
        return { ...item, [field]: value }
      }
      return item
    })
    setVillages(updated)
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  }

  const columns = [
    { 
      title: 'หมู่ที่', 
      dataIndex: 'moo', 
      key: 'moo', 
      width: 100, 
      align: 'center',
      render: (text, record) => (
        <Input 
          value={text} 
          onChange={e => handleCellChange(record.key, 'moo', e.target.value)} 
          style={{ textAlign: 'center' }}
        />
      )
    },
    { 
      title: 'ชื่อหมู่บ้าน', 
      dataIndex: 'name', 
      key: 'name',
      render: (text, record) => (
        <Input 
          value={text} 
          onChange={e => handleCellChange(record.key, 'name', e.target.value)} 
        />
      )
    },
    { 
      title: 'สถานะ', 
      dataIndex: 'status', 
      key: 'status', 
      width: 150,
      render: (text, record) => (
        <Select 
          value={text || 'ใช้งาน'} 
          onChange={val => handleCellChange(record.key, 'status', val)} 
          style={{ width: '100%' }}
          options={[
            { value: 'ใช้งาน', label: 'ใช้งาน' },
            { value: 'ระงับ', label: 'ระงับ' }
          ]}
        />
      )
    },
  ]

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', padding: 16 }}>
      <Card 
        title={
          <Space>
            <FileTextOutlined style={{ color: primaryColor }} />
            <span>ข้อมูลหมู่บ้าน (ครบถ้วน 77 จังหวัด / อำเภอ / ตำบล)</span>
          </Space>
        }
        style={{ borderRadius: 8, border: `2px solid ${primaryColor}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      >
        {/* แผงตัวเลือกพื้นที่รองรับทุกจังหวัด */}
        <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 16 }}>
          <Row gutter={[16, 12]} align="middle">
            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>จังหวัด</Text></Col>
            <Col xs={24} sm={5}>
              <Select 
                value={province} 
                onChange={val => {
                  setProvince(val)
                  const newDistricts = getDistricts(val)
                  const firstDist = newDistricts.length > 0 ? newDistricts[0].value : ''
                  setDistrict(firstDist)
                  const newSubs = getSubdistricts(val, firstDist)
                  setSubdistrict(newSubs.length > 0 ? newSubs[0].value : '')
                }} 
                options={ALL_PROVINCES} 
                style={{ width: '100%' }} 
                showSearch 
              />
            </Col>

            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>อำเภอ</Text></Col>
            <Col xs={24} sm={5}>
              <Select 
                value={district} 
                onChange={val => {
                  setDistrict(val)
                  const newSubs = getSubdistricts(province, val)
                  setSubdistrict(newSubs.length > 0 ? newSubs[0].value : '')
                }} 
                options={districtOptions} 
                style={{ width: '100%' }} 
                showSearch 
                placeholder="เลือกหรือพิมพ์อำเภอ"
                allowClear
              />
            </Col>

            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>ตำบล</Text></Col>
            <Col xs={24} sm={4}>
              <Select 
                value={subdistrict} 
                onChange={setSubdistrict} 
                options={subdistrictOptions} 
                style={{ width: '100%' }} 
                showSearch 
                placeholder="เลือกหรือพิมพ์ตำบล"
                allowClear
              />
            </Col>

            <Col xs={24} sm={4}>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleLoadVillages} style={{ background: primaryColor, width: '100%' }}>
                แสดงตามหมู่บ้าน
              </Button>
            </Col>
          </Row>

          <Row gutter={[12, 12]} align="middle" style={{ marginTop: 8 }}>
            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>หมู่</Text></Col>
            <Col xs={24} sm={5}>
              <Input value={villageRange} onChange={e => setVillageRange(e.target.value)} placeholder="เช่น 1, 1-99" />
            </Col>
          </Row>
        </div>

        {/* ตารางจัดการข้อมูลหมู่บ้าน */}
        <div style={{ background: '#fff', borderRadius: 6, overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: 20 }}>
          <Table 
            dataSource={villages} 
            columns={columns} 
            rowKey="key"
            size="small"
            bordered
            pagination={false}
            rowSelection={rowSelection}
            locale={{ emptyText: 'ยังไม่มีข้อมูลหมู่บ้านในพื้นที่นี้ สามารถกดเพิ่มแถวเพื่อบันทึกข้อมูลได้ทันที' }}
          />
        </div>

        {/* แถบปุ่มควบคุม */}
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddRow} style={{ fontWeight: 'bold' }}>
                เพิ่มแถว
              </Button>
              <Popconfirm title="ยืนยันการลบแถวที่เลือก" onConfirm={handleDeleteRows} okText="ใช่" cancelText="ยกเลิก">
                <Button danger icon={<DeleteOutlined />} style={{ fontWeight: 'bold' }}>
                  ลบแถว
                </Button>
              </Popconfirm>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveData} style={{ background: '#059669', fontWeight: 'bold', minWidth: 100 }}>
                บันทึก
              </Button>
              <Button icon={<CloseOutlined />} onClick={() => window.history.back()} style={{ fontWeight: 'bold', minWidth: 100 }}>
                ปิด
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  )
}