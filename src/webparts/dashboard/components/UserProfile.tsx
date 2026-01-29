import * as React from "react";
import { Persona, PersonaSize } from "@fluentui/react";
import { WebPartContext } from "@microsoft/sp-webpart-base";

interface UserProfileProps {
  context: WebPartContext;
}

const UserProfile: React.FC<UserProfileProps> = ({ context }) => {
  const { user } = context.pageContext;

  // 🔹 Foto padrão do SharePoint (Office 365)
  const photoUrl = `${context.pageContext.web.absoluteUrl}/_layouts/15/userphoto.aspx?size=M&accountname=${user.email}`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Persona
        text={user.displayName}
        imageUrl={photoUrl}
        size={PersonaSize.size32}
        hidePersonaDetails={false}
      />
    </div>
  );
};

export default UserProfile;
