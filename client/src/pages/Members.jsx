import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { 
  Table, 
  Card, 
  Input, 
  Button, 
  Space, 
  Tag, 
  Select, 
  Row, 
  Col, 
  Typography, 
  Modal, 
  Form, 
  DatePicker, 
  Checkbox,
  Tabs,
  Divider,
  message,
  Tooltip,
  Popconfirm
} from 'antd'
import { 
  SearchOutlined, 
  UserAddOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  CopyOutlined,
  UserOutlined,
  TeamOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

const relationOptions = [
  { value: 'บุตร', label: 'บุตร' },
  { value: 'คู่สมรส', label: 'คู่สมรส' },
  { value: 'บิดา', label: 'บิดา' },
  { value: 'มารดา', label: 'มารดา' },
  { value: 'พี่', label: 'พี่' },
  { value: 'น้อง', label: 'น้อง' },
  { value: 'ลุง', label: 'ลุง' },
  { value: 'ป้า', label: 'ป้า' },
  { value: 'น้า', label: 'น้า' },
  { value: 'อา', label: 'อา' },
  { value: 'หลาน', label: 'หลาน' },
]

export default function Members() {
  const outletContext = useOutletContext() || {}
  const user = outletContext.user || { role: 'staff', name: 'เจ้าหน้าที่' }
  
  const theme = outletContext.theme || { primary: '#1f3a8a' }
  const primaryColor = theme.primary || '#1f3a8a'

  const isStaff = user?.role === 'staff'

  // โหลดข้อมูลจาก localStorage เท่านั้น (ไม่มีข้อมูลจำลองสำรอง)
  const [members, setMembers] = useState(() => {
    try {
      const saved = localStorage.getItem('funeral_members')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {
      console.error(e)
    }
    return []
  })

  const [searchText, setSearchText] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [form] = Form.useForm()

  // ซิงค์ข้อมูลลง localStorage ทุกครั้งที่มีการเปลี่ยนแปลง
  useEffect(() => {
    localStorage.setItem('funeral_members', JSON.stringify(members))
  }, [members])

  const getNextMemberId = () => {
    if (members.length === 0) return '1'
    const maxId = Math.max(...members.map(m => parseInt(m.id) || 0))
    return (maxId + 1).toString()
  }

  const calculateAgeAndSet = (date) => {
    if (date) {
      const birthYear = date.year()
      const currentYear = dayjs().year()
      const age = currentYear - birthYear
      form.setFieldsValue({ age: age > 0 ? age : 0 })
    }
  }

  const handleBirthDateChange = (date) => {
    calculateAgeAndSet(date)
  }

  const handleBirthDateInputConfirm = (e) => {
    const textValue = e.target.value?.trim()
    if (!textValue) return

    let parsedDate = null
    if (/^\d{4}$/.test(textValue)) {
      let year = parseInt(textValue, 10)
      if (year > 2400) year -= 543
      parsedDate = dayjs(`${year}-01-01`)
    } else {
      const parts = textValue.split(/[\/\-]/)
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0')
        const month = parts[1].padStart(2, '0')
        let year = parseInt(parts[2], 10)
        if (year > 2400) year -= 543
        parsedDate = dayjs(`${year}-${month}-${day}`)
      }
    }

    if (parsedDate && parsedDate.isValid()) {
      form.setFieldsValue({ birthDate: parsedDate })
      calculateAgeAndSet(parsedDate)
      message.success(`ตั้งวันที่เกิดเป็น: ${parsedDate.format('DD/MM/YYYY')}`)
    }
  }

  const handleRegDateChange = (date) => {
    if (date) {
      const protectDate = date.add(30, 'day')
      form.setFieldsValue({ protectDate })
    }
  }

  const handleImmediateProtectChange = (e) => {
    const isChecked = e.target.checked
    if (isChecked) {
      form.setFieldsValue({ status: 'ปกติ' })
      message.info('ปรับสถานะเป็น "ปกติ" ตามการอนุมัติเรียบร้อยแล้ว')
    } else {
      form.setFieldsValue({ status: 'สมาชิกใหม่' })
    }
  }

  const handleUseMemberAsReceiver = () => {
    const values = form.getFieldsValue()
    const fullName = `${values.prefix || ''}${values.firstName || ''} ${values.lastName || ''}`.trim()
    form.setFieldsValue({ receiverName: fullName })
    message.success('ดึงชื่อสมาชิกเป็นผู้รับจดหมายเรียบร้อยแล้ว')
  }

  const handleUseBeneficiaryAsReceiver = () => {
    const values = form.getFieldsValue()
    if (values.bene1_name) {
      form.setFieldsValue({ receiverName: values.bene1_name })
      message.success('ดึงชื่อผู้รับผลประโยชน์คนที่ 1 เป็นผู้รับจดหมายเรียบร้อยแล้ว')
    } else {
      message.warning('ยังไม่ได้กรอกข้อมูลผู้รับผลประโยชน์คนที่ 1')
    }
  }

  const handleCopyAddress = () => {
    const values = form.getFieldsValue()
    form.setFieldsValue({
      receiverHouseNo: values.houseNo,
      receiverStreet: values.street,
      receiverMoo: values.moo,
      receiverSubDistrict: values.subDistrict,
      receiverDistrict: values.district,
      receiverProvince: values.province,
      receiverZipcode: values.zipcode,
    })
    message.success('คัดลอกที่อยู่สมาชิกมาใส่ช่องผู้รับจดหมายเรียบร้อยแล้ว')
  }

  const handleCopyBeneficiaryAddress = (index) => {
    const values = form.getFieldsValue()
    const fullAddress = `${values.houseNo || ''} หมู่ ${values.moo || ''} ต.${values.subDistrict || ''} อ.${values.district || ''} จ.${values.province || ''} ${values.zipcode || ''}`.trim()
    form.setFieldsValue({ [`bene${index}_address`]: fullAddress })
    message.success(`คัดลอกที่อยู่ให้ผู้รับผลประโยชน์คนที่ ${index} เรียบร้อยแล้ว`)
  }

  const filteredData = members.filter(item => {
    const matchSearch = 
      item.id?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.lastName?.toLowerCase().includes(searchText.toLowerCase()) ||
      `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase().includes(searchText.toLowerCase())
    
    const matchGroup = selectedGroup === 'ALL' || item.group === selectedGroup
    const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus

    return matchSearch && matchGroup && matchStatus
  })

  const renderStatusTag = (status) => {
    switch (status) {
      case 'ปกติ': return <Tag color="green">ปกติ</Tag>
      case 'สมาชิกใหม่': return <Tag color="blue">สมาชิกใหม่</Tag>
      case 'ขาดสิทธิ์': return <Tag color="orange">ขาดสิทธิ์</Tag>
      case 'เสียชีวิต': return <Tag color="red">เสียชีวิต</Tag>
      case 'ลาออก': return <Tag color="default">ลาออก</Tag>
      default: return <Tag>{status || '-'}</Tag>
    }
  }

  const columns = [
    {
      title: 'เลขที่สมาชิก',
      dataIndex: 'id',
      key: 'id',
      width: 110,
      sorter: (a, b) => parseInt(a.id) - parseInt(b.id),
      render: (text) => <Text strong style={{ color: primaryColor }}>{text}</Text>
    },
    { title: 'กลุ่ม', dataIndex: 'group', key: 'group', width: 70, align: 'center' },
    { title: 'คำนำหน้า', dataIndex: 'prefix', key: 'prefix', width: 80 },
    { title: 'ชื่อ', dataIndex: 'firstName', key: 'firstName' },
    { title: 'นามสกุล', dataIndex: 'lastName', key: 'lastName' },
    { 
      title: 'ยอดคงเหลือ (บาท)', 
      dataIndex: 'balance', 
      key: 'balance', 
      align: 'right',
      render: (val) => <span style={{ color: Number(val) < 0 ? 'red' : 'inherit' }}>{Number(val || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status) => renderStatusTag(status),
    },
    {
      title: 'จัดการ',
      key: 'actions',
      align: 'center',
      width: 80,
      render: (_, record) => (
        <Tooltip title="แก้ไขข้อมูล">
          <Button type="text" icon={<EditOutlined style={{ color: primaryColor }} />} onClick={() => handleEdit(record)} />
        </Tooltip>
      ),
    },
  ]

  const handleEdit = (record) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      birthDate: record.birthDate ? dayjs(record.birthDate) : null,
      regDate: record.regDate ? dayjs(record.regDate) : null,
      protectDate: record.protectDate ? dayjs(record.protectDate) : null,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (key) => {
    if (isStaff) {
      message.error('❌ เจ้าหน้าที่ทั่วไปไม่มีสิทธิ์ลบข้อมูลสมาชิก')
      return
    }
    setMembers(members.filter(item => item.key !== key))
    message.success('ลบข้อมูลสมาชิกเรียบร้อยแล้ว')
    setIsModalOpen(false)
  }

  const handleAddMember = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({
      id: getNextMemberId(),
      group: '0',
      type: 'สมาชิก',
      gender: 'หญิง',
      regDate: dayjs(),
      protectDate: dayjs().add(30, 'day'),
      status: 'สมาชิกใหม่',
    })
    setIsModalOpen(true)
  }

  const handleModalSave = () => {
    form.validateFields().then(values => {
      const formattedValues = {
        ...values,
        birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : '',
        regDate: values.regDate ? values.regDate.format('YYYY-MM-DD') : '',
        protectDate: values.protectDate ? values.protectDate.format('YYYY-MM-DD') : '',
      }

      if (editingRecord) {
        const updated = members.map(item => item.key === editingRecord.key ? { ...item, ...formattedValues } : item)
        setMembers(updated)
        message.success('อัปเดตข้อมูลสมาชิกเรียบร้อยแล้ว')
      } else {
        const newMember = {
          key: Date.now().toString(),
          ...formattedValues,
          balance: 0,
          lastPayDate: 'ยังไม่เคยชำระ',
          hasPaidMaintenance: false
        }
        setMembers([newMember, ...members])
        message.success('บันทึกสมาชิกใหม่เรียบร้อยแล้ว')
      }
      setIsModalOpen(false)
    })
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Header */}
      <Card style={{ marginBottom: 16, borderRadius: 8, borderLeft: `4px solid ${primaryColor}` }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0, color: primaryColor }}>👤 ข้อมูลสมาชิกฌาปนกิจ</Title>
            <Text type="secondary">ผู้ใช้งานปัจจุบัน: <strong style={{ color: primaryColor }}>{user?.name}</strong> ({isStaff ? 'เจ้าหน้าที่ทั่วไป - เพิ่ม/แก้ไขได้' : 'ผู้จัดการ / Dev - จัดการเต็มรูปแบบ'})</Text>
          </Col>
          <Col>
            <Button type="primary" icon={<UserAddOutlined />} size="large" style={{ background: primaryColor }} onClick={handleAddMember}>
              สมัครใหม่
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Filter Bar */}
      <Card bodyStyle={{ padding: '16px' }} style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>ค้นหาชื่อ หรือ เลขสมาชิก</Text>
            <Input
              placeholder="พิมพ์ชื่อ นามสกุล หรือ เลขทะเบียน..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} md={5}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>กลุ่มหมู่บ้าน</Text>
            <Select value={selectedGroup} onChange={setSelectedGroup} style={{ width: '100%' }}>
              <Option value="ALL">ทั้งหมด</Option>
              <Option value="0">กลุ่ม 0</Option>
              <Option value="10">กลุ่ม 10</Option>
              <Option value="93">กลุ่ม 93</Option>
            </Select>
          </Col>
          <Col xs={12} md={5}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>สถานะสิทธิ</Text>
            <Select value={selectedStatus} onChange={setSelectedStatus} style={{ width: '100%' }}>
              <Option value="ALL">ทั้งหมด</Option>
              <Option value="ปกติ">ปกติ</Option>
              <Option value="สมาชิกใหม่">สมาชิกใหม่</Option>
              <Option value="ขาดสิทธิ์">ขาดสิทธิ์</Option>
              <Option value="เสียชีวิต">เสียชีวิต</Option>
              <Option value="ลาออก">ลาออก</Option>
            </Select>
          </Col>
          <Col xs={24} md={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button icon={<ReloadOutlined />} onClick={() => { setSearchText(''); setSelectedGroup('ALL'); setSelectedStatus('ALL'); }} style={{ width: '100%', marginTop: 22 }}>
              รีเซ็ต
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <Table 
          columns={columns} 
          dataSource={filteredData}
          pagination={{ pageSize: 10, showTotal: (total) => `พบสมาชิกทั้งหมด ${total} ราย` }}
          bordered
          size="middle"
          locale={{ emptyText: 'ยังไม่มีข้อมูลสมาชิกในระบบ' }}
          onRow={(record) => ({
            onDoubleClick: () => handleEdit(record),
            style: { cursor: 'default' }
          })}
        />
      </Card>
      
      {/* Modal แก้ไข/เพิ่ม สมาชิก */}
      <Modal
        title={editingRecord ? 'แก้ไขข้อมูลสมาชิก' : 'บันทึกสมัครสมาชิกใหม่'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={950}
        footer={[
          <Row key="modal-footer" justify="space-between" align="middle" style={{ width: '100%' }}>
            <Col>
              {editingRecord && (
                !isStaff ? (
                  <Popconfirm title="ยืนยันการลบ" description="คุณต้องการลบข้อมูลสมาชิกนี้หรือไม่?" onConfirm={() => handleDelete(editingRecord.key)} okText="ลบ" cancelText="ยกเลิก" okButtonProps={{ danger: true }}>
                    <Button danger icon={<DeleteOutlined />}>ลบข้อมูล</Button>
                  </Popconfirm>
                ) : (
                  <Tooltip title="เจ้าหน้าที่ทั่วไปไม่มีสิทธิ์ลบข้อมูลสมาชิก">
                    <Button danger disabled icon={<DeleteOutlined />}>ลบข้อมูล (ถูกจำกัดสิทธิ์)</Button>
                  </Tooltip>
                )
              )}
            </Col>
            <Col>
              <Space>
                <Button onClick={() => setIsModalOpen(false)}>ปิด</Button>
                <Button type="primary" onClick={handleModalSave} style={{ background: primaryColor }}>บันทึก</Button>
              </Space>
            </Col>
          </Row>
        ]}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          
          <Row gutter={16} style={{ background: '#f8fafc', padding: '12px 12px 0 12px', borderRadius: 6, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <Col xs={24} sm={6}>
              <Form.Item name="id" label="รหัสสมาชิก">
                <Input style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item name="group" label="กลุ่ม">
                <Input placeholder="ระบุกลุ่ม" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item name="type" label="ประเภท">
                <Select style={{ width: '100%' }}>
                  <Option value="สมาชิก">สมาชิก</Option>
                  <Option value="คู่สมรส">คู่สมรส</Option>
                  <Option value="นอก">นอก</Option>
                  <Option value="อื่นๆ">อื่นๆ</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item name="status" label="สถานะสิทธิ">
                <Select style={{ width: '100%' }}>
                  <Option value="สมาชิกใหม่">สมาชิกใหม่</Option>
                  <Option value="ปกติ">ปกติ</Option>
                  <Option value="ขาดสิทธิ์">ขาดสิทธิ์</Option>
                  <Option value="ลาออก">ลาออก</Option>
                  <Option value="เสียชีวิต">เสียชีวิต</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Tabs defaultActiveKey="1" items={[
            {
              key: '1',
              label: 'ข้อมูลสมาชิก',
              children: (
                <div style={{ padding: '8px 0' }}>
                  <Row gutter={16}>
                    <Col xs={24} sm={4}>
                      <Form.Item name="prefix" label="คำนำหน้า">
                        <Select style={{ width: '100%' }}>
                          <Option value="นาย">นาย</Option>
                          <Option value="นาง">นาง</Option>
                          <Option value="นางสาว">นางสาว</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={10}>
                      <Form.Item name="firstName" label="ชื่อ">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={10}>
                      <Form.Item name="lastName" label="นามสกุล">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={4}>
                      <Form.Item name="gender" label="เพศ">
                        <Select style={{ width: '100%' }}>
                          <Option value="ชาย">ชาย</Option>
                          <Option value="หญิง">หญิง</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item name="idCard" label="บัตรประชาชน">
                        <Input maxLength={13} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item name="birthDate" label="วันที่เกิด">
                        <DatePicker 
                          style={{ width: '100%' }} 
                          onChange={handleBirthDateChange} 
                          onPressEnter={handleBirthDateInputConfirm}
                          onBlur={handleBirthDateInputConfirm}
                          placeholder="วว/ดด/ปปปป หรือ พ.ศ."
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={4}>
                      <Form.Item name="age" label="อายุ (ปี)">
                        <Input readOnly style={{ background: '#f1f5f9', width: '100%', textAlign: 'center' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16} align="middle">
                    <Col xs={24} sm={8}>
                      <Form.Item name="regDate" label="วันที่สมัคร">
                        <DatePicker style={{ width: '100%' }} onChange={handleRegDateChange} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item name="protectDate" label="วันที่ได้รับคุ้มครอง">
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8} style={{ paddingTop: 6 }}>
                      <Form.Item name="immediateProtect" valuePropName="checked" style={{ margin: 0 }}>
                        <Checkbox onChange={handleImmediateProtectChange}>คุ้มครองทันทีตามมติคณะกรรมการ</Checkbox>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={6}>
                      <Form.Item name="houseNo" label="บ้านเลขที่">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="street" label="ถนน / ซอย">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Form.Item name="moo" label="หมู่ที่">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={8}>
                      <Form.Item name="province" label="จังหวัด">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item name="district" label="อำเภอ">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item name="subDistrict" label="ตำบล">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={8}>
                      <Form.Item name="zipcode" label="รหัสไปรษณีย์">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={16}>
                      <Form.Item name="spouseName" label="ชื่อคู่สมรส">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider style={{ margin: '16px 0' }} />

                  <Row gutter={16} align="middle">
                    <Col xs={24} sm={14}>
                      <Form.Item name="receiverName" label="ชื่อผู้รับจดหมาย (สำหรับเรียกเก็บเงินประจำปี)" style={{ marginBottom: 8 }}>
                        <Input placeholder="ระบุชื่อผู้รับจดหมาย..." style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={10} style={{ display: 'flex', gap: 6, paddingTop: 22 }}>
                      <Button icon={<UserOutlined />} onClick={handleUseMemberAsReceiver} size="small">ชื่อสมาชิก</Button>
                      <Button icon={<TeamOutlined />} onClick={handleUseBeneficiaryAsReceiver} size="small">ผู้รับผลประโยชน์</Button>
                      <Button icon={<CopyOutlined />} onClick={handleCopyAddress} size="small">คัดลอกที่อยู่</Button>
                    </Col>
                  </Row>

                  <Row gutter={16} style={{ marginTop: 8 }}>
                    <Col xs={24} sm={6}>
                      <Form.Item name="receiverHouseNo" label="บ้านเลขที่ผู้รับ">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="receiverStreet" label="ถนน-ซอย ผู้รับ">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Form.Item name="receiverMoo" label="หมู่ที่ผู้รับ">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={8}>
                      <Form.Item name="receiverSubDistrict" label="ตำบลผู้รับ">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item name="receiverDistrict" label="อำเภอผู้รับ">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item name="receiverProvince" label="จังหวัดผู้รับ">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={8}>
                      <Form.Item name="receiverZipcode" label="รหัสไปรษณีย์ผู้รับ">
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                </div>
              )
            },
            {
              key: '2',
              label: 'ผู้รับผลประโยชน์',
              children: (
                <div style={{ padding: '8px 0' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>รายชื่อผู้รับผลประโยชน์และที่อยู่ (สูงสุด 5 ท่าน)</Text>
                  
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} style={{ marginBottom: 16, background: '#f8fafc', padding: '12px 16px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      <Row gutter={16}>
                        <Col xs={24} sm={14}>
                          <Form.Item name={`bene${i}_name`} label={`ผู้รับผลประโยชน์คนที่ ${i}`} style={{ marginBottom: 8 }}>
                            <Input placeholder={`ชื่อ-นามสกุล ผู้รับผลประโยชน์ ${i}`} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={10}>
                          <Form.Item name={`bene${i}_relation`} label="เกี่ยวข้องเป็น" style={{ marginBottom: 8 }}>
                            <Select 
                              placeholder="เลือกหรือพิมพ์ความสัมพันธ์"
                              showSearch
                              allowClear
                              options={relationOptions}
                              style={{ width: '100%' }}
                              getPopupContainer={(triggerNode) => triggerNode.parentNode}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16} align="middle">
                        <Col xs={24} sm={20}>
                          <Form.Item name={`bene${i}_address`} label={`ที่อยู่ ${i}`} style={{ marginBottom: 0 }}>
                            <Input placeholder="บ้านเลขที่ ถนน หมู่ที่ ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={4} style={{ display: 'flex', alignItems: 'flex-end', paddingTop: 22 }}>
                          <Button icon={<CopyOutlined />} block onClick={() => handleCopyBeneficiaryAddress(i)}>คัดลอกที่อยู่</Button>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>
              )
            },
            {
              key: '3',
              label: 'บันทึกหมายเหตุ',
              children: (
                <div style={{ padding: '8px 0' }}>
                  <Form.Item name="note" label="หมายเหตุเพิ่มเติม">
                    <Input.TextArea rows={5} placeholder="ระบุหมายเหตุหรือบันทึกช่วยจำ..." />
                  </Form.Item>
                </div>
              )
            }
          ]} />

        </Form>
      </Modal>

    </div>
  )
}