import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from "react"

import { useGetConfigQuery, useGetMeQuery, useUpdateConfigMutation } from "entities/user/api"

import { userConfig as baseUserConfig } from "shared/config/base-user-config"

interface MeContextType {
  me: User | null
  userConfig: UserConfig | null
  updateConfig: (data: object) => Promise<void>
  isLoading: boolean
}

export const MeContext = createContext<MeContextType>({
  me: null,
  userConfig: null,
  updateConfig: async () => {},
  isLoading: false,
})

export const MeProvider = ({ children }: PropsWithChildren) => {
  const { data: me, isLoading: isMeLoading } = useGetMeQuery()
  const { data: config, isLoading: isConfigLoading } = useGetConfigQuery({}, { skip: !me })
  const [updateConfigMutation] = useUpdateConfigMutation()
  const [userConfig, setUserConfig] = useState(baseUserConfig)

  useEffect(() => {
    if (!config) {
      return
    }

    if (!Object.keys(config).length) {
      updateConfig(baseUserConfig)
      return
    }

    setUserConfig(config)
  }, [config])

  const updateConfig = async (data: object) => {
    const newConfig = {
      ...userConfig,
      ...data,
    }

    setUserConfig(newConfig)
    await updateConfigMutation(newConfig)
  }

  const value: MeContextType | null = useMemo(() => {
    if (!me) {
      return null
    }

    return {
      me,
      userConfig,
      updateConfig,
      isLoading: isMeLoading || isConfigLoading,
    }
  }, [me, userConfig, updateConfig, isMeLoading, isConfigLoading])

  if (!value) {
    return null
  }

  return <MeContext.Provider value={value}>{children}</MeContext.Provider>
}

export const useMeContext = () => {
  const context = useContext(MeContext)
  if (!context) {
    throw new Error("useMeContext must be used within MeProvider")
  }
  return context
}
