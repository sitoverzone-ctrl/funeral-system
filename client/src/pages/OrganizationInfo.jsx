import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { 
  Card, 
  Input, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Space, 
  InputNumber, 
  Select,
  Upload,
  message,
  Popconfirm
} from 'antd'
import { 
  SettingOutlined, 
  SaveOutlined, 
  UploadOutlined, 
  PictureOutlined,
  ReloadOutlined 
} from '@ant-design/icons'

const { Text } = Typography
const { Option } = Select

export default function OrganizationInfo() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const initialFormState = {
    code: '',
    name: '',
    address: '',
    village: '',
    amphoe: '',
    amphoeCode: '',
    province: '',
    provinceCode: '',
    zipcode: '',
    president: '',
    annualFee: 0,
    advanceReceiptFee: 0,
    corpseDeductionRate: 50,
    groupingType: 'กำหนดเอง',
    applicationFee: 0,
    maintenanceFee: 0,
    welfareDeductionRate: 0,
    cutoffDate: '',
    eligibleDays: 30,
    rightAdjustmentDay: 0,
    warningThreshold: 0,
    receiptBookLines: '10-11',
    logo: ''
  }

  const [formData, setFormData] = useState(initialFormState)
  const [logoPreview, setLogoPreview] = useState('')

  // โหลดข้อมูลที่ตั้งค่าไว้จาก LocalStorage ตอนเปิดหน้าจอ
  useEffect(() => {
    const savedData = localStorage.getItem('funeral_organization_info')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setFormData(parsed)
        if (parsed.logo) {
          setLogoPreview(parsed.logo)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // ฟังก์ชันย่อขนาดรูปภาพและแปลงเป็น Base64
  const handleLogoChange = (info) => {
    const file = info.file.originFileObj || info.file
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target.result
        img.onload = () => {
          // ย่อขนาดรูปภาพไม่ให้เกิน 300px เพื่อประหยัดพื้นที่ LocalStorage
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 300
          const MAX_HEIGHT = 300
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          const compressedBase64 = canvas.toDataURL('image/png', 0.8)
          setLogoPreview(compressedBase64)
          setFormData(prev => ({ ...prev, logo: compressedBase64 }))
          message.success('อัปโหลดและปรับขนาดโลโก้สำเร็จ')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // บันทึกข้อมูลลง LocalStorage พร้อมดักจับข้อผิดพลาด
  const handleSave = () => {
    try {
      const dataToSave = {
        ...formData,
        logo: logoPreview || formData.logo || ''
      }
      localStorage.setItem('funeral_organization_info', JSON.stringify(dataToSave))
      message.success('บันทึกข้อมูลหน่วยงานและตั้งค่าระบบสำเร็จ (มีผลกับทุกหน้าในโปรแกรมแล้ว)')
    } catch (error) {
      console.error(error)
      message.error('❌ ไม่สามารถบันทึกได้ เนื่องจากไฟล์โลโก้มีขนาดใหญ่เกินไป หรือความจำเบราว์เซอร์เต็ม')
    }
  }

  // ฟังก์ชันรีเซ็ตข้อมูลเฉพาะหน้านี้
  const handleResetForm = () => {
    localStorage.removeItem('funeral_organization_info')
    setFormData(initialFormState)
    setLogoPreview('')
    message.success('รีเซ็ตข้อมูลหน่วยงานในหน้านี้เรียบร้อยแล้ว')
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40, padding: '16px' }}>
      
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space>
              <SettingOutlined style={{ color: primaryColor }} />
              <span>ข้อมูลหน่วยงาน / ตั้งค่าสมาคม & โลโก้</span>
            </Space>
            
            {/* ปุ่มรีเซ็ตข้อมูลขวาบน */}
            <Popconfirm
              title="ยืนยันการรีเซ็ตข้อมูล"
              description="คุณต้องการล้างข้อมูลการตั้งค่าหน่วยงานในหน้านี้ใช่หรือไม่?"
              onConfirm={handleResetForm}
              okText="ใช่"
              cancelText="ยกเลิก"
            >
              <Button danger icon={<ReloadOutlined />} size="middle">
                รีเซ็ตข้อมูลหน่วยงาน
              </Button>
            </Popconfirm>
          </div>
        }
        style={{ borderRadius: 8, marginBottom: 16, borderLeft: `4px solid ${primaryColor}` }}
      >
        <Row gutter={[16, 16]}>
          {/* ข้อมูลทั่วไป */}
          <Col xs={24} md={6}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>รหัส</Text>
            <Input size="large" placeholder="ระบุรหัสสมาคม..." value={formData.code} onChange={e => handleChange('code', e.target.value)} />
          </Col>
          <Col xs={24} md={18}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>ชื่อสมาคม</Text>
            <Input size="large" placeholder="ระบุชื่อสมาคม..." value={formData.name} onChange={e => handleChange('name', e.target.value)} />
          </Col>

          <Col xs={24} md={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>ที่อยู่</Text>
            <Input size="large" placeholder="ถนน / บ้านเลขที่..." value={formData.address} onChange={e => handleChange('address', e.target.value)} style={{ marginBottom: 8 }} />
            <Input size="large" placeholder="หมู่บ้าน / ตำบล..." value={formData.village} onChange={e => handleChange('village', e.target.value)} />
          </Col>
          <Col xs={24} md={12}>
            <Row gutter={8}>
              <Col span={14}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>อำเภอ</Text>
                <Input size="large" placeholder="ระบุอำเภอ..." value={formData.amphoe} onChange={e => handleChange('amphoe', e.target.value)} />
              </Col>
              <Col span={10}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>รหัสอำเภอ</Text>
                <Input size="large" placeholder="รหัส..." value={formData.amphoeCode} onChange={e => handleChange('amphoeCode', e.target.value)} />
              </Col>
            </Row>
            <Row gutter={8} style={{ marginTop: 8 }}>
              <Col span={14}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>จังหวัด</Text>
                <Input size="large" placeholder="ระบุจังหวัด..." value={formData.province} onChange={e => handleChange('province', e.target.value)} />
              </Col>
              <Col span={10}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>รหัสจังหวัด</Text>
                <Input size="large" placeholder="รหัส..." value={formData.provinceCode} onChange={e => handleChange('provinceCode', e.target.value)} />
              </Col>
            </Row>
          </Col>

          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>รหัสไปรษณีย์</Text>
            <Input size="large" placeholder="รหัสไปรษณีย์..." value={formData.zipcode} onChange={e => handleChange('zipcode', e.target.value)} />
          </Col>
          <Col xs={24} md={16}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>ชื่อนายก</Text>
            <Input size="large" placeholder="ชื่อนายกสมาคม..." value={formData.president} onChange={e => handleChange('president', e.target.value)} />
          </Col>
        </Row>

        {/* ส่วนจัดการโลโก้สำหรับหน้า Login และหัวรายงาน */}
        <div style={{ marginTop: 24 }}>
          <Card 
            size="small" 
            title={<Space><PictureOutlined style={{ color: primaryColor }} /><span>โลโก้สมาคม (สำหรับแสดงผลหน้า Login และหัวรายงาน)</span></Space>}
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          >
            <Row gutter={16} align="middle">
              <Col xs={24} md={16}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>ลิงก์รูปภาพโลโก้ (URL) หรืออัปโหลดไฟล์ด้านข้าง</Text>
                <Input 
                  size="large" 
                  placeholder="https://example.com/logo.png หรืออัปโหลดไฟล์" 
                  value={formData.logo} 
                  onChange={e => {
                    handleChange('logo', e.target.value)
                    setLogoPreview(e.target.value)
                  }} 
                  style={{ marginBottom: 12 }}
                />
                
                <Upload 
                  beforeUpload={() => false} 
                  showUploadList={false} 
                  onChange={handleLogoChange}
                >
                  <Button icon={<UploadOutlined />}>เลือกไฟล์รูปภาพโลโก้จากเครื่อง</Button>
                </Upload>
              </Col>

              <Col xs={24} md={8} style={{ textAlign: 'center', paddingTop: 10 }}>
                <div style={{ width: 100, height: 100, margin: '0 auto', border: '1px dashed #cbd5e1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', overflow: 'hidden' }}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>ตัวอย่างโลโก้</Text>
                  )}
                </div>
              </Col>
            </Row>
          </Card>
        </div>

        {/* เงื่อนไขสมาคมฯ */}
        <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <Text strong style={{ fontSize: 16, color: primaryColor, display: 'block', marginBottom: 16 }}>เงื่อนไขการดำเนินงานและอัตราค่าธรรมเนียม</Text>
          
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Row align="middle" justify="space-between">
                  <Col span={14}><Text>อัตราค่าเงินสงเคราะห์รายปี:</Text></Col>
                  <Col span={10}><InputNumber size="large" value={formData.annualFee} onChange={v => handleChange('annualFee', v)} style={{ width: '100%' }} /></Col>
                </Row>
                <Row align="middle" justify="space-between">
                  <Col span={14}><Text>อัตราหักเงินสงเคราะห์ศพละ:</Text></Col>
                  <Col span={10}><InputNumber size="large" value={formData.corpseDeductionRate} onChange={v => handleChange('corpseDeductionRate', v)} style={{ width: '100%' }} /></Col>
                </Row>
                <Row align="middle" justify="space-between">
                  <Col span={14}><Text>เงินค่าสมัคร:</Text></Col>
                  <Col span={10}><InputNumber size="large" value={formData.applicationFee} onChange={v => handleChange('applicationFee', v)} style={{ width: '100%' }} /></Col>
                </Row>
                <Row align="middle" justify="space-between">
                  <Col span={14}><Text>เงินค่าบำรุง:</Text></Col>
                  <Col span={10}><InputNumber size="large" value={formData.maintenanceFee} onChange={v => handleChange('maintenanceFee', v)} style={{ width: '100%' }} /></Col>
                </Row>
                <Row align="middle" justify="space-between">
                  <Col span={14}><Text>อัตราหักสวัสดิการจ่าย (%):</Text></Col>
                  <Col span={10}><InputNumber size="large" value={formData.welfareDeductionRate} onChange={v => handleChange('welfareDeductionRate', v)} style={{ width: '100%' }} /></Col>
                </Row>
                <Row align="middle" justify="space-between">
                  <Col span={14}><Text>ระยะเวลาได้รับสิทธิ (วัน):</Text></Col>
                  <Col span={10}><InputNumber size="large" value={formData.eligibleDays} onChange={v => handleChange('eligibleDays', v)} style={{ width: '100%' }} /></Col>
                </Row>
                <Row align="middle" justify="space-between">
                  <Col span={14}><Text>ออกหนังสือเตือนเงินต่ำกว่า:</Text></Col>
                  <Col span={10}><InputNumber size="large" value={formData.warningThreshold} onChange={v => handleChange('warningThreshold', v)} style={{ width: '100%' }} /></Col>
                </Row>
              </Space>
            </Col>

            <Col xs={24} md={12}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Row align="middle" justify="space-between">
                  <Col span={14}><Text>ค่าคงที่ในใบเสร็จเงินสงเคราะห์ล่วงหน้า:</Text></Col>
                  <Col span={10}><InputNumber size="large" value={formData.advanceReceiptFee} onChange={v => handleChange('advanceReceiptFee', v)} style={{ width: '100%' }} /></Col>
                </Row>
                <Row align="middle" justify="space-between">
                  <Col span={14}><Text>การสร้างกลุ่ม:</Text></Col>
                  <Col span={10}>
                    <Select size="large" value={formData.groupingType} onChange={v => handleChange('groupingType', v)} style={{ width: '100%' }}>
                      <Option value="กำหนดเอง">กำหนดเอง</Option>
                      <Option value="ตามหมู่บ้าน">ตามหมู่บ้าน</Option>
                    </Select>
                  </Col>
                </Row>
                <Row align="middle" justify="space-between">
                  <Col span={14}><Text>ตัดตายทุกวันที่:</Text></Col>
                  <Col span={10}><Input size="large" placeholder="ระบุวัน..." value={formData.cutoffDate} onChange={e => handleChange('cutoffDate', e.target.value)} /></Col>
                </Row>
                <Row align="middle" justify="space-between">
                  <Col span={14}><Text>ปรับสิทธิทุกวันที่:</Text></Col>
                  <Col span={10}><InputNumber size="large" value={formData.rightAdjustmentDay} onChange={v => handleChange('rightAdjustmentDay', v)} style={{ width: '100%' }} /></Col>
                </Row>
                <Row align="middle" justify="space-between">
                  <Col span={14}><Text>เว้นบรรทัดพิมพ์สมุด:</Text></Col>
                  <Col span={10}><Input size="large" value={formData.receiptBookLines} onChange={e => handleChange('receiptBookLines', e.target.value)} /></Col>
                </Row>
              </Space>
            </Col>
          </Row>
        </div>

        {/* ปุ่มบันทึก */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSave} style={{ background: '#059669', minWidth: 160, height: 48, fontSize: 16 }}>
            บันทึกข้อมูล
          </Button>
        </div>

      </Card>

    </div>
  )
}