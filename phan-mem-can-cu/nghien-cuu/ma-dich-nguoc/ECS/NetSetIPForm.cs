using System;
using System.ComponentModel;
using System.Drawing;
using System.Windows.Forms;
using MyIpTextBox;

namespace ECS;

public class NetSetIPForm : Form
{
	private IContainer components;

	private Button okButton;

	private Button cancelButton;

	private RadioButton Eth_DHCP_radioButton;

	private RadioButton Eth_SetIP_radioButton;

	private Label mask_label;

	private Label gateway_label;

	private IpTextBox ipTextBox1;

	private IpTextBox ipTextBox2;

	private IpTextBox ipTextBox3;

	private Label IP_label;

	public int IP1_1;

	public int IP1_2;

	public int IP1_3;

	public int IP1_4;

	public int IP2_1;

	public int IP2_2;

	public int IP2_3;

	public int IP2_4;

	public int IP3_1;

	public int IP3_2;

	public int IP3_3;

	public int IP3_4;

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.NetSetIPForm));
		this.okButton = new System.Windows.Forms.Button();
		this.cancelButton = new System.Windows.Forms.Button();
		this.Eth_DHCP_radioButton = new System.Windows.Forms.RadioButton();
		this.Eth_SetIP_radioButton = new System.Windows.Forms.RadioButton();
		this.mask_label = new System.Windows.Forms.Label();
		this.gateway_label = new System.Windows.Forms.Label();
		this.ipTextBox3 = new MyIpTextBox.IpTextBox();
		this.ipTextBox2 = new MyIpTextBox.IpTextBox();
		this.ipTextBox1 = new MyIpTextBox.IpTextBox();
		this.IP_label = new System.Windows.Forms.Label();
		base.SuspendLayout();
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.okButton, "okButton");
		this.okButton.Name = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.okButton.Click += new System.EventHandler(okButton_Click);
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Eth_DHCP_radioButton, "Eth_DHCP_radioButton");
		this.Eth_DHCP_radioButton.Checked = true;
		this.Eth_DHCP_radioButton.Name = "Eth_DHCP_radioButton";
		this.Eth_DHCP_radioButton.TabStop = true;
		this.Eth_DHCP_radioButton.UseVisualStyleBackColor = true;
		this.Eth_DHCP_radioButton.CheckedChanged += new System.EventHandler(Eth_DHCP_radioButton_CheckedChanged);
		resources.ApplyResources(this.Eth_SetIP_radioButton, "Eth_SetIP_radioButton");
		this.Eth_SetIP_radioButton.Name = "Eth_SetIP_radioButton";
		this.Eth_SetIP_radioButton.UseVisualStyleBackColor = true;
		this.Eth_SetIP_radioButton.CheckedChanged += new System.EventHandler(Eth_DHCP_radioButton_CheckedChanged);
		resources.ApplyResources(this.mask_label, "mask_label");
		this.mask_label.Name = "mask_label";
		resources.ApplyResources(this.gateway_label, "gateway_label");
		this.gateway_label.Name = "gateway_label";
		this.ipTextBox3.BackColor = System.Drawing.SystemColors.ControlLightLight;
		resources.ApplyResources(this.ipTextBox3, "ipTextBox3");
		this.ipTextBox3.IP1 = 0;
		this.ipTextBox3.IP2 = 0;
		this.ipTextBox3.IP3 = 0;
		this.ipTextBox3.IP4 = 0;
		this.ipTextBox3.IpText = "0.0.0.0";
		this.ipTextBox3.Name = "ipTextBox3";
		this.ipTextBox2.BackColor = System.Drawing.SystemColors.ControlLightLight;
		resources.ApplyResources(this.ipTextBox2, "ipTextBox2");
		this.ipTextBox2.IP1 = 0;
		this.ipTextBox2.IP2 = 0;
		this.ipTextBox2.IP3 = 0;
		this.ipTextBox2.IP4 = 0;
		this.ipTextBox2.IpText = "0.0.0.0";
		this.ipTextBox2.Name = "ipTextBox2";
		this.ipTextBox1.BackColor = System.Drawing.SystemColors.ControlLightLight;
		resources.ApplyResources(this.ipTextBox1, "ipTextBox1");
		this.ipTextBox1.IP1 = 0;
		this.ipTextBox1.IP2 = 0;
		this.ipTextBox1.IP3 = 0;
		this.ipTextBox1.IP4 = 0;
		this.ipTextBox1.IpText = "0.0.0.0";
		this.ipTextBox1.Name = "ipTextBox1";
		resources.ApplyResources(this.IP_label, "IP_label");
		this.IP_label.Name = "IP_label";
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.ipTextBox3);
		base.Controls.Add(this.ipTextBox2);
		base.Controls.Add(this.ipTextBox1);
		base.Controls.Add(this.Eth_SetIP_radioButton);
		base.Controls.Add(this.Eth_DHCP_radioButton);
		base.Controls.Add(this.cancelButton);
		base.Controls.Add(this.gateway_label);
		base.Controls.Add(this.IP_label);
		base.Controls.Add(this.mask_label);
		base.Controls.Add(this.okButton);
		base.Name = "NetSetIPForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(NetSetIPForm_Load);
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public NetSetIPForm(string IPs)
	{
		InitializeComponent();
		string[] array = IPs.Split('.', ':');
		ipTextBox1.IP1 = (ipTextBox3.IP1 = short.Parse(array[0]));
		ipTextBox1.IP2 = (ipTextBox3.IP2 = short.Parse(array[1]));
		ipTextBox1.IP3 = (ipTextBox3.IP3 = short.Parse(array[2]));
		ipTextBox1.IP4 = short.Parse(array[3]);
		ipTextBox3.IP4 = 1;
		ipTextBox2.IP1 = (ipTextBox2.IP2 = (ipTextBox2.IP3 = 255));
		ipTextBox2.IP4 = 0;
	}

	private void Eth_DHCP_radioButton_CheckedChanged(object sender, EventArgs e)
	{
		IpTextBox ipTextBox = ipTextBox1;
		IpTextBox ipTextBox2 = this.ipTextBox2;
		bool flag = (ipTextBox3.Enabled = Eth_SetIP_radioButton.Checked);
		bool enabled = (ipTextBox2.Enabled = flag);
		ipTextBox.Enabled = enabled;
	}

	private void okButton_Click(object sender, EventArgs e)
	{
		IP1_1 = ipTextBox1.IP1;
		IP1_2 = ipTextBox1.IP2;
		IP1_3 = ipTextBox1.IP3;
		IP1_4 = ipTextBox1.IP4;
		IP2_1 = ipTextBox2.IP1;
		IP2_2 = ipTextBox2.IP2;
		IP2_3 = ipTextBox2.IP3;
		IP2_4 = ipTextBox2.IP4;
		IP3_1 = ipTextBox3.IP1;
		IP3_2 = ipTextBox3.IP2;
		IP3_3 = ipTextBox3.IP3;
		IP3_4 = ipTextBox3.IP4;
		if (Eth_DHCP_radioButton.Checked)
		{
			IP1_4 = 0;
		}
	}

	private void NetSetIPForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_SetIP");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		Eth_DHCP_radioButton.Text = Program.GetLang("pw_ObtainanIPaddressautomatically");
		Eth_SetIP_radioButton.Text = Program.GetLang("pw_UsethefollowingIPaddress");
		gateway_label.Text = Program.GetLang("pw_Defaultgateway_sl_");
		IP_label.Text = Program.GetLang("pw_IPaddress") + ":";
		mask_label.Text = Program.GetLang("pw_Defaultgateway_sl_") + ":";
		okButton.Text = Program.GetLang("pw_OK");
	}
}
