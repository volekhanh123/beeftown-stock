using System;
using System.ComponentModel;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Windows.Forms;
using ECS.Properties;

namespace ECS;

internal class AboutBox : Form
{
	private IContainer components;

	private TableLayoutPanel tableLayoutPanel;

	private PictureBox logoPictureBox;

	private Label labelProductName;

	private Label labelVersion;

	private Label labelCopyright;

	private Label labelCompanyName;

	private TextBox textBoxDescription;

	private Button okButton;

	public static string AssemblyTitle
	{
		get
		{
			object[] customAttributes = Assembly.GetExecutingAssembly().GetCustomAttributes(typeof(AssemblyTitleAttribute), inherit: false);
			if (customAttributes.Length > 0)
			{
				AssemblyTitleAttribute assemblyTitleAttribute = (AssemblyTitleAttribute)customAttributes[0];
				if (assemblyTitleAttribute.Title.Length == 0)
				{
					return assemblyTitleAttribute.Title;
				}
			}
			return Path.GetFileNameWithoutExtension(Assembly.GetExecutingAssembly().CodeBase);
		}
	}

	public static string AssemblyVersion => Assembly.GetExecutingAssembly().GetName().Version.ToString();

	public static string AssemblyDescription
	{
		get
		{
			object[] customAttributes = Assembly.GetExecutingAssembly().GetCustomAttributes(typeof(AssemblyDescriptionAttribute), inherit: false);
			if (customAttributes.Length == 0)
			{
				return "";
			}
			return ((AssemblyDescriptionAttribute)customAttributes[0]).Description;
		}
	}

	public static string AssemblyProduct
	{
		get
		{
			object[] customAttributes = Assembly.GetExecutingAssembly().GetCustomAttributes(typeof(AssemblyProductAttribute), inherit: false);
			if (customAttributes.Length == 0)
			{
				return "";
			}
			return ((AssemblyProductAttribute)customAttributes[0]).Product;
		}
	}

	public static string AssemblyCopyright
	{
		get
		{
			object[] customAttributes = Assembly.GetExecutingAssembly().GetCustomAttributes(typeof(AssemblyCopyrightAttribute), inherit: false);
			if (customAttributes.Length == 0)
			{
				return "";
			}
			return ((AssemblyCopyrightAttribute)customAttributes[0]).Copyright;
		}
	}

	public static string AssemblyCompany
	{
		get
		{
			object[] customAttributes = Assembly.GetExecutingAssembly().GetCustomAttributes(typeof(AssemblyCompanyAttribute), inherit: false);
			if (customAttributes.Length == 0)
			{
				return "";
			}
			return ((AssemblyCompanyAttribute)customAttributes[0]).Company;
		}
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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.AboutBox));
		this.tableLayoutPanel = new System.Windows.Forms.TableLayoutPanel();
		this.logoPictureBox = new System.Windows.Forms.PictureBox();
		this.labelProductName = new System.Windows.Forms.Label();
		this.labelVersion = new System.Windows.Forms.Label();
		this.labelCopyright = new System.Windows.Forms.Label();
		this.labelCompanyName = new System.Windows.Forms.Label();
		this.textBoxDescription = new System.Windows.Forms.TextBox();
		this.okButton = new System.Windows.Forms.Button();
		this.tableLayoutPanel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.logoPictureBox).BeginInit();
		base.SuspendLayout();
		resources.ApplyResources(this.tableLayoutPanel, "tableLayoutPanel");
		this.tableLayoutPanel.Controls.Add(this.logoPictureBox, 0, 0);
		this.tableLayoutPanel.Controls.Add(this.labelProductName, 1, 0);
		this.tableLayoutPanel.Controls.Add(this.labelVersion, 1, 1);
		this.tableLayoutPanel.Controls.Add(this.labelCopyright, 1, 2);
		this.tableLayoutPanel.Controls.Add(this.labelCompanyName, 1, 3);
		this.tableLayoutPanel.Controls.Add(this.textBoxDescription, 1, 4);
		this.tableLayoutPanel.Controls.Add(this.okButton, 1, 5);
		this.tableLayoutPanel.Name = "tableLayoutPanel";
		resources.ApplyResources(this.logoPictureBox, "logoPictureBox");
		this.logoPictureBox.Name = "logoPictureBox";
		this.tableLayoutPanel.SetRowSpan(this.logoPictureBox, 6);
		this.logoPictureBox.TabStop = false;
		resources.ApplyResources(this.labelProductName, "labelProductName");
		this.labelProductName.Name = "labelProductName";
		resources.ApplyResources(this.labelVersion, "labelVersion");
		this.labelVersion.Name = "labelVersion";
		resources.ApplyResources(this.labelCopyright, "labelCopyright");
		this.labelCopyright.Name = "labelCopyright";
		resources.ApplyResources(this.labelCompanyName, "labelCompanyName");
		this.labelCompanyName.Name = "labelCompanyName";
		resources.ApplyResources(this.textBoxDescription, "textBoxDescription");
		this.textBoxDescription.Name = "textBoxDescription";
		this.textBoxDescription.ReadOnly = true;
		this.textBoxDescription.TabStop = false;
		resources.ApplyResources(this.okButton, "okButton");
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		this.okButton.Name = "okButton";
		base.AcceptButton = this.okButton;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.CancelButton = this.okButton;
		base.Controls.Add(this.tableLayoutPanel);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "AboutBox";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(AboutBox_Load);
		this.tableLayoutPanel.ResumeLayout(false);
		this.tableLayoutPanel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.logoPictureBox).EndInit();
		base.ResumeLayout(false);
	}

	public AboutBox()
	{
		string filename = Application.StartupPath + "\\Resources\\" + Settings.Default.elogoPictureBox;
		InitializeComponent();
		logoPictureBox.Image = new Bitmap(filename);
		int num = logoPictureBox.Image.Size.Height * (logoPictureBox.Size.Width - logoPictureBox.Margin.Horizontal) / logoPictureBox.Image.Size.Width + logoPictureBox.Margin.Vertical;
		if (num > logoPictureBox.Size.Height)
		{
			base.Size = new Size(base.Size.Width, base.Size.Height + num - logoPictureBox.Size.Height);
			logoPictureBox.Size = new Size(logoPictureBox.Size.Width, num);
		}
		labelProductName.Text = AssemblyProduct;
		labelVersion.Text = AssemblyVersion;
		labelCopyright.Text = AssemblyCopyright;
		labelCompanyName.Text = AssemblyCompany;
		textBoxDescription.Text = AssemblyDescription;
	}

	private void AboutBox_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_About");
		okButton.Text = Program.GetLang("pw_OK");
	}
}
