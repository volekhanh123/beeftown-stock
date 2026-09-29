using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS.Properties;

namespace ECS;

public class GuiderForm : Form
{
	private class CustomButton
	{
		public PictureBox pb;

		public Label ll;

		public Label info;

		private Image im1;

		private Image im2;

		private int infox;

		private int infoy;

		private void MouseEnter(object sender, EventArgs e)
		{
			pb.Image = im2;
			ll.ForeColor = Color.Red;
			info.Visible = true;
		}

		private void MouseLeave(object sender, EventArgs e)
		{
			pb.Image = im1;
			ll.ForeColor = SystemColors.ControlText;
			info.Visible = false;
		}

		public CustomButton(Panel pl, string name, string iname, EventHandler MouseClick, string fim1, string fim2)
		{
			im1 = Image.FromFile(fim1);
			im2 = Image.FromFile(fim2);
			pb = new PictureBox();
			pb.BackColor = Color.Transparent;
			pb.Location = new Point(0, 0);
			pb.Name = name;
			pb.Size = new Size(100, 100);
			pb.SizeMode = PictureBoxSizeMode.StretchImage;
			pb.TabStop = false;
			pb.Tag = "";
			pb.Click += MouseClick.Invoke;
			pb.MouseEnter += MouseEnter;
			pb.MouseLeave += MouseLeave;
			ll = new Label();
			ll.AutoSize = false;
			ll.BackColor = Color.Transparent;
			ll.Location = new Point(0, 0);
			ll.Name = name;
			ll.Size = new Size(100, 100);
			ll.Text = name;
			ll.Click += MouseClick.Invoke;
			ll.MouseEnter += MouseEnter;
			ll.MouseLeave += MouseLeave;
			ll.TextAlign = ContentAlignment.BottomCenter;
			info = new Label();
			info.AutoSize = true;
			info.BackColor = Color.Transparent;
			info.Location = new Point(0, 0);
			info.Name = iname;
			info.Text = iname;
			info.TextAlign = ContentAlignment.MiddleCenter;
			pl.Controls.Add(pb);
			pl.Controls.Add(info);
			pb.Controls.Add(ll);
			MouseLeave(null, null);
			pb.Visible = (ll.Visible = false);
		}

		public void Resize_Info()
		{
			if (pb.Visible)
			{
				info.Font = new Font(info.Font.FontFamily, 30f, FontStyle.Bold);
				while (infox <= info.Width || infoy <= info.Height)
				{
					info.Font = new Font(info.Font.FontFamily, (float)((double)info.Font.Size - 0.2), FontStyle.Bold);
				}
				info.Location = new Point((infox - info.Width) / 2, (infoy - info.Height) / 2);
			}
		}

		public void Resize(int x, int y, int sxy, int infox, int infoy)
		{
			this.infox = infox;
			this.infoy = infoy;
			PictureBox pictureBox = pb;
			bool visible = (ll.Visible = true);
			pictureBox.Visible = visible;
			pb.Location = new Point(x, y);
			pb.Size = new Size(sxy, sxy);
			int num = (int)((double)sxy * 0.05);
			ll.Location = new Point(num, num);
			ll.Size = new Size(sxy - num * 2, sxy - num * 2);
			ll.Font = new Font(ll.Font.FontFamily, sxy / 12);
			Resize_Info();
		}

		public void Hide()
		{
			PictureBox pictureBox = pb;
			Label label = ll;
			bool flag = (info.Visible = false);
			bool visible = (label.Visible = flag);
			pictureBox.Visible = visible;
		}
	}

	private const double ud_line = 0.15;

	private CustomButton cb_wizard;

	private CustomButton cb_ethernet;

	private CustomButton cb_setting;

	private CustomButton cb_txt;

	private CustomButton cb_usb;

	private CustomButton cb_report;

	private CustomButton cb_excel;

	private List<CustomButton> cb = new List<CustomButton>();

	public bool mf_Docking;

	private double ud_YdivX = 1.0;

	private int ud_dot;

	private IContainer components;

	private Panel ul_Panel;

	private SplitContainer ud_SplitContainer;

	private SplitContainer u_lr_SplitContainer;

	public Panel ur_Panel;

	public Panel d_Panel;

	private UIDataSet uiDataSet;

	public GuiderForm()
	{
		InitializeComponent();
	}

	public void Ethernet_Docked(bool docked)
	{
		if (docked)
		{
			cb_ethernet.ll.Text = Program.GetLang("pw_UndockEthernet");
			cb_ethernet.info.Text = Program.GetLang("pw_UndockEthernet_wInfo");
			cb_ethernet.Resize_Info();
		}
		else
		{
			cb_ethernet.ll.Text = Program.GetLang("pw_DockEthernet");
			cb_ethernet.info.Text = Program.GetLang("pw_DockEthernet_wInfo");
			cb_ethernet.Resize_Info();
		}
	}

	public void Report_Docked(bool docked)
	{
		if (docked)
		{
			cb_report.ll.Text = Program.GetLang("pw_UndockReport");
			cb_report.info.Text = Program.GetLang("pw_UndockReport_wInfo");
			cb_report.Resize_Info();
		}
		else
		{
			cb_report.ll.Text = Program.GetLang("pw_DockReport");
			cb_report.info.Text = Program.GetLang("pw_DockReport_wInfo");
			cb_report.Resize_Info();
		}
	}

	public void ReItems()
	{
		cb.Clear();
		cb.Add(cb_wizard);
		if (!Settings.Default.gen_DockingEthernet)
		{
			cb.Add(cb_ethernet);
		}
		else
		{
			cb_ethernet.Hide();
		}
		if (!Settings.Default.gen_DockingReport)
		{
			cb.Add(cb_report);
		}
		else
		{
			cb_report.Hide();
		}
		cb.Add(cb_usb);
		cb.Add(cb_excel);
		if (uiDataSet.TXTForm_Type.Count > 0 || Settings.Default.txtfileFormat.Length > 4)
		{
			cb.Add(cb_txt);
		}
		else
		{
			cb_txt.Hide();
		}
		cb.Add(cb_setting);
	}

	private void GuiderForm_Load(object sender, EventArgs e)
	{
		u_lr_SplitContainer.SplitterDistance = (u_lr_SplitContainer.Size.Width - 4) / 2;
		ud_SplitContainer.SplitterDistance = (ud_SplitContainer.Size.Height - 4) / 2;
		try
		{
			ul_Panel.BackgroundImage = Image.FromFile(Application.StartupPath + "\\Resources\\Guider.jpg");
		}
		catch (Exception)
		{
		}
		string fileName = Application.StartupPath + "\\Combo.xml";
		uiDataSet.TXTForm_Type.ReadXml(fileName);
		ul_Panel.BackgroundImage = Image.FromFile(Application.StartupPath + "\\Resources\\Guider.jpg");
		cb_wizard = new CustomButton(ul_Panel, Program.GetLang("pw_ConfigWizard"), Program.GetLang("pw_ConfigWizard_wInfo"), wizard_PictureBox_Click, Application.StartupPath + "\\Resources\\Guider_Wizard_1.png", Application.StartupPath + "\\Resources\\Guider_Wizard_2.png");
		cb_ethernet = new CustomButton(ul_Panel, Program.GetLang("pw_DockEthernet"), Program.GetLang("pw_DockEthernet_wInfo"), ethernet_PictureBox_Click, Application.StartupPath + "\\Resources\\Guider_Ethernet_1.png", Application.StartupPath + "\\Resources\\Guider_Ethernet_2.png");
		cb_report = new CustomButton(ul_Panel, Program.GetLang("pw_DockReport"), Program.GetLang("pw_DockReport_wInfo"), report_PictureBox_Click, Application.StartupPath + "\\Resources\\Guider_Report_1.png", Application.StartupPath + "\\Resources\\Guider_Report_2.png");
		cb_setting = new CustomButton(ul_Panel, Program.GetLang("pw_AdvancedSetting"), Program.GetLang("pw_AdvancedSetting_wInfo"), setting_PictureBox_Click, Application.StartupPath + "\\Resources\\Guider_Setting_1.png", Application.StartupPath + "\\Resources\\Guider_Setting_2.png");
		cb_txt = new CustomButton(ul_Panel, Program.GetLang("pw_CustomFile"), Program.GetLang("pw_CustomFile_wInfo"), txt_PictureBox_Click, Application.StartupPath + "\\Resources\\Guider_TXT_1.png", Application.StartupPath + "\\Resources\\Guider_TXT_2.png");
		cb_usb = new CustomButton(ul_Panel, Program.GetLang("pw_TMSFile"), Program.GetLang("pw_TMSFile_wInfo"), usb_PictureBox_Click, Application.StartupPath + "\\Resources\\Guider_USB_1.png", Application.StartupPath + "\\Resources\\Guider_USB_2.png");
		cb_excel = new CustomButton(ul_Panel, Program.GetLang("pw_ExcelCSVFile"), Program.GetLang("pw_ExcelCSVFile_wInfo"), excel_PictureBox_Click, Application.StartupPath + "\\Resources\\Guider_Excel_1.png", Application.StartupPath + "\\Resources\\Guider_Excel_2.png");
		ReItems();
	}

	public void mf_Dock_Resize()
	{
		if (!mf_Docking || !ul_Panel.Visible || ul_Panel.Size.Width < 32 || ul_Panel.Size.Height < 32)
		{
			return;
		}
		int num = 0;
		int num2 = 0;
		int num3 = 0;
		int num4 = 0;
		int num5 = cb.Count + 3;
		ud_dot = (int)(0.15 * (double)ul_Panel.Size.Height);
		int num6 = 2;
		int num7 = 0;
		while (true)
		{
			int num8 = (num5 + num6 - 1) / num6;
			int num9 = ul_Panel.Size.Width / num8;
			int num10 = (ul_Panel.Size.Height - ud_dot) / num6;
			if ((double)num9 * ud_YdivX > (double)num10)
			{
				num9 = (int)((double)num10 / ud_YdivX);
			}
			else
			{
				num10 = (int)((double)num9 * ud_YdivX);
			}
			if (num9 <= num3)
			{
				break;
			}
			num3 = num9;
			num4 = num10;
			num = num8;
			num2 = num6;
			num6++;
		}
		num7 = (ul_Panel.Size.Width - num * num3) / 2;
		int num11 = (ul_Panel.Size.Height - ud_dot - num2 * num4) / 2 + ud_dot;
		int num12 = 0;
		for (int i = 0; i < num2; i++)
		{
			if (num12 >= cb.Count)
			{
				break;
			}
			for (int j = 0; j < num; j++)
			{
				if (num12 >= cb.Count)
				{
					break;
				}
				if (num12 == 0)
				{
					cb[num12].Resize(num7 + 2, num11 + 2, num3 * 2 - 4, ul_Panel.Width, (int)((double)ul_Panel.Height * 0.15));
					num12++;
				}
				else if (j >= 2 || i >= 2)
				{
					cb[num12].Resize(num7 + 2 + num3 * j, num11 + 2 + num4 * i, num3 - 4, ul_Panel.Width, (int)((double)ul_Panel.Height * 0.15));
					num12++;
				}
			}
		}
	}

	public void mf_Dock_Start()
	{
		mf_Docking = true;
		base.MinimizeBox = false;
		base.MaximizeBox = false;
		mf_Dock_In();
	}

	public void mf_Dock_End()
	{
		mf_Dock_Out();
		mf_Docking = false;
		base.MinimizeBox = true;
		base.MaximizeBox = true;
		Close();
	}

	public void mf_Dock_In()
	{
		base.FormBorderStyle = FormBorderStyle.None;
		base.WindowState = FormWindowState.Normal;
		Dock = DockStyle.Fill;
	}

	public void mf_Dock_Out()
	{
		base.FormBorderStyle = FormBorderStyle.Sizable;
		base.WindowState = FormWindowState.Maximized;
	}

	private void GuiderForm_Activated(object sender, EventArgs e)
	{
		SendToBack();
	}

	private void usb_PictureBox_Click(object sender, EventArgs e)
	{
		Program.mf.Guider_Click_USB();
	}

	private void wizard_PictureBox_Click(object sender, EventArgs e)
	{
		Program.mf.Guider_Click_Wizard();
	}

	private void ethernet_PictureBox_Click(object sender, EventArgs e)
	{
		Program.mf.Guider_Click_Ethernet();
	}

	private void report_PictureBox_Click(object sender, EventArgs e)
	{
		Program.mf.Guider_Click_Report();
	}

	private void setting_PictureBox_Click(object sender, EventArgs e)
	{
		Program.mf.Guider_Click_Setting();
	}

	private void txt_PictureBox_Click(object sender, EventArgs e)
	{
		Program.mf.Guider_Click_TXT();
	}

	private void excel_PictureBox_Click(object sender, EventArgs e)
	{
		Program.mf.Guider_Click_Excel();
	}

	public void expand_normal()
	{
		if (ud_SplitContainer.Size.Height >= 20 && ud_SplitContainer.Size.Width >= 20)
		{
			ud_SplitContainer.SplitterDistance = (ud_SplitContainer.Size.Height - 4) / 2;
			u_lr_SplitContainer.SplitterDistance = (u_lr_SplitContainer.Size.Width - 4) / 2;
			if (Program.mf.m_netForm != null && !Program.mf.m_netForm.IsDisposed && Program.mf.m_netForm.mf_Docked)
			{
				Program.mf.m_netForm.mf_Shrink();
			}
			if (Program.mf.m_reportForm != null && !Program.mf.m_reportForm.IsDisposed && Program.mf.m_reportForm.mf_Docked)
			{
				Program.mf.m_reportForm.mf_Shrink();
			}
		}
	}

	public void expand_ur()
	{
		if (ud_SplitContainer.Size.Height >= 20 && ud_SplitContainer.Size.Width >= 20)
		{
			ud_SplitContainer.SplitterDistance = (ud_SplitContainer.Size.Height - 4) * 3 / 4;
			u_lr_SplitContainer.SplitterDistance = (u_lr_SplitContainer.Size.Width - 4) / 4;
			if (Program.mf.m_netForm != null && !Program.mf.m_netForm.IsDisposed && Program.mf.m_netForm.mf_Docked)
			{
				Program.mf.m_netForm.mf_Expand();
			}
			if (Program.mf.m_reportForm != null && !Program.mf.m_reportForm.IsDisposed && Program.mf.m_reportForm.mf_Docked)
			{
				Program.mf.m_reportForm.mf_Shrink();
			}
		}
	}

	public void expand_d()
	{
		if (ud_SplitContainer.Size.Height >= 20 && ud_SplitContainer.Size.Width >= 20)
		{
			ud_SplitContainer.SplitterDistance = (ud_SplitContainer.Size.Height - 4) / 4;
			u_lr_SplitContainer.SplitterDistance = (u_lr_SplitContainer.Size.Width - 4) / 2;
			if (Program.mf.m_netForm != null && !Program.mf.m_netForm.IsDisposed && Program.mf.m_netForm.mf_Docked)
			{
				Program.mf.m_netForm.mf_Shrink();
			}
			if (Program.mf.m_reportForm != null && !Program.mf.m_reportForm.IsDisposed && Program.mf.m_reportForm.mf_Docked)
			{
				Program.mf.m_reportForm.mf_Expand();
			}
		}
	}

	private void ul_Panel_SizeChanged(object sender, EventArgs e)
	{
		mf_Dock_Resize();
	}

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
		this.ul_Panel = new System.Windows.Forms.Panel();
		this.ud_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.u_lr_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.ur_Panel = new System.Windows.Forms.Panel();
		this.d_Panel = new System.Windows.Forms.Panel();
		this.uiDataSet = new ECS.UIDataSet();
		this.ud_SplitContainer.Panel1.SuspendLayout();
		this.ud_SplitContainer.Panel2.SuspendLayout();
		this.ud_SplitContainer.SuspendLayout();
		this.u_lr_SplitContainer.Panel1.SuspendLayout();
		this.u_lr_SplitContainer.Panel2.SuspendLayout();
		this.u_lr_SplitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		base.SuspendLayout();
		this.ul_Panel.BackColor = System.Drawing.SystemColors.Control;
		this.ul_Panel.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Stretch;
		this.ul_Panel.Dock = System.Windows.Forms.DockStyle.Fill;
		this.ul_Panel.Location = new System.Drawing.Point(0, 0);
		this.ul_Panel.Name = "ul_Panel";
		this.ul_Panel.Size = new System.Drawing.Size(384, 431);
		this.ul_Panel.TabIndex = 4;
		this.ul_Panel.SizeChanged += new System.EventHandler(ul_Panel_SizeChanged);
		this.ud_SplitContainer.Dock = System.Windows.Forms.DockStyle.Fill;
		this.ud_SplitContainer.IsSplitterFixed = true;
		this.ud_SplitContainer.Location = new System.Drawing.Point(0, 0);
		this.ud_SplitContainer.Name = "ud_SplitContainer";
		this.ud_SplitContainer.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.ud_SplitContainer.Panel1.Controls.Add(this.u_lr_SplitContainer);
		this.ud_SplitContainer.Panel2.Controls.Add(this.d_Panel);
		this.ud_SplitContainer.Size = new System.Drawing.Size(772, 520);
		this.ud_SplitContainer.SplitterDistance = 431;
		this.ud_SplitContainer.TabIndex = 5;
		this.u_lr_SplitContainer.Dock = System.Windows.Forms.DockStyle.Fill;
		this.u_lr_SplitContainer.IsSplitterFixed = true;
		this.u_lr_SplitContainer.Location = new System.Drawing.Point(0, 0);
		this.u_lr_SplitContainer.Name = "u_lr_SplitContainer";
		this.u_lr_SplitContainer.Panel1.Controls.Add(this.ul_Panel);
		this.u_lr_SplitContainer.Panel2.Controls.Add(this.ur_Panel);
		this.u_lr_SplitContainer.Size = new System.Drawing.Size(772, 431);
		this.u_lr_SplitContainer.SplitterDistance = 384;
		this.u_lr_SplitContainer.TabIndex = 0;
		this.ur_Panel.Dock = System.Windows.Forms.DockStyle.Fill;
		this.ur_Panel.Location = new System.Drawing.Point(0, 0);
		this.ur_Panel.Name = "ur_Panel";
		this.ur_Panel.Size = new System.Drawing.Size(384, 431);
		this.ur_Panel.TabIndex = 0;
		this.d_Panel.Dock = System.Windows.Forms.DockStyle.Fill;
		this.d_Panel.Location = new System.Drawing.Point(0, 0);
		this.d_Panel.Name = "d_Panel";
		this.d_Panel.Size = new System.Drawing.Size(772, 85);
		this.d_Panel.TabIndex = 0;
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 12f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		this.BackColor = System.Drawing.SystemColors.AppWorkspace;
		base.ClientSize = new System.Drawing.Size(772, 520);
		base.Controls.Add(this.ud_SplitContainer);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
		base.Name = "GuiderForm";
		this.Text = "BackDockForm";
		base.Activated += new System.EventHandler(GuiderForm_Activated);
		base.Load += new System.EventHandler(GuiderForm_Load);
		this.ud_SplitContainer.Panel1.ResumeLayout(false);
		this.ud_SplitContainer.Panel2.ResumeLayout(false);
		this.ud_SplitContainer.ResumeLayout(false);
		this.u_lr_SplitContainer.Panel1.ResumeLayout(false);
		this.u_lr_SplitContainer.Panel2.ResumeLayout(false);
		this.u_lr_SplitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		base.ResumeLayout(false);
	}
}
