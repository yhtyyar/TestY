import { Col, Row, Typography } from "antd"
import { useMeContext } from "processes"
import { useTranslation } from "react-i18next"
import { ProfileAvatar } from "widgets"

import { ChangeLang, ChangeTheme } from "features/system"
import { ChangeProfile } from "features/user"

import styles from "./styles.module.css"

const { Title, Text } = Typography

export const ProfileField = ({ label, value }: { label: string; value: string }) => {
  return (
    <>
      <Col span={12}>
        <Text type="secondary">{label}</Text>
      </Col>
      <Col span={12}>
        <Text strong>{value}</Text>
      </Col>
    </>
  )
}

export const ProfilePage = () => {
  const { t } = useTranslation()
  const { me } = useMeContext()

  if (!me) {
    return null
  }

  return (
    <div className={styles.wrapperPage}>
      <Title level={1} style={{ marginBottom: 40 }}>
        {t("Profile")}
      </Title>
      <Row gutter={[64, 64]} align="top">
        <Col>
          <ProfileAvatar />
        </Col>

        <Col>
          <Row align="middle" justify="space-between" style={{ marginBottom: 20 }}>
            <Title level={3}>{t("General")}</Title>
            <div className={styles.generalActions}>
              <ChangeProfile />
            </div>§
          </Row>

          <Row gutter={[16, 24]}>
            <ProfileField label={t("Username")} value={me.username} />
            <ProfileField label={t("Email")} value={me.email} />
            {me.first_name && <ProfileField label={t("First Name")} value={me.first_name} />}
            {me.last_name && <ProfileField label={t("Last Name")} value={me.last_name} />}
          </Row>
        </Col>

        <Col>
          <Title level={3} style={{ marginBottom: 20 }}>
            {t("Interface")}
          </Title>

          <Row gutter={[16, 8]} align="middle">
            <Col span={8}>
              <Text type="secondary">{t("Theme")}</Text>
            </Col>
            <Col span={16}>
              <ChangeTheme />
            </Col>

            <Col span={8}>
              <Text type="secondary">{t("Language")}</Text>
            </Col>
            <Col span={16}>
              <ChangeLang />
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  )
}
